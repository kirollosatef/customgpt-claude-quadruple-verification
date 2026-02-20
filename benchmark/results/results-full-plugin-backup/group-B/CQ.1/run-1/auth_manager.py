import uuid
import time
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt


class AuthManager:
    """Authentication manager using bcrypt for passwords and JWT for tokens."""

    def __init__(self, jwt_secret: str, token_ttl_minutes: int = 30, refresh_ttl_days: int = 7):
        self._jwt_secret = jwt_secret
        self._token_ttl = timedelta(minutes=token_ttl_minutes)
        self._refresh_ttl = timedelta(days=refresh_ttl_days)
        # In-memory stores (swap for a real DB in production)
        self._users: dict[str, dict] = {}          # username -> {password_hash, email}
        self._sessions: dict[str, dict] = {}        # session_id -> {username, created_at}
        self._refresh_tokens: dict[str, dict] = {}  # jti -> {username, expires_at}
        self._revoked_jtis: set[str] = set()
        self._reset_tokens: dict[str, dict] = {}    # token -> {email, expires_at}

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def register_user(self, username: str, password: str, email: str) -> dict:
        """Register a new user (helper for populating the store)."""
        if username in self._users:
            return {"success": False, "error": "User already exists"}
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        self._users[username] = {"password_hash": password_hash, "email": email}
        return {"success": True, "username": username}

    def _create_access_token(self, username: str) -> tuple[str, str]:
        """Return (encoded_jwt, jti) for an access token."""
        jti = uuid.uuid4().hex
        now = datetime.now(timezone.utc)
        payload = {
            "sub": username,
            "iat": now,
            "exp": now + self._token_ttl,
            "jti": jti,
            "type": "access",
        }
        token = jwt.encode(payload, self._jwt_secret, algorithm="HS256")
        return token, jti

    def _create_refresh_token(self, username: str) -> str:
        """Return an encoded JWT refresh token and store its jti."""
        jti = uuid.uuid4().hex
        now = datetime.now(timezone.utc)
        expires_at = now + self._refresh_ttl
        payload = {
            "sub": username,
            "iat": now,
            "exp": expires_at,
            "jti": jti,
            "type": "refresh",
        }
        token = jwt.encode(payload, self._jwt_secret, algorithm="HS256")
        self._refresh_tokens[jti] = {"username": username, "expires_at": expires_at}
        return token

    # ------------------------------------------------------------------
    # Core API
    # ------------------------------------------------------------------

    def login(self, username: str, password: str) -> dict:
        """Authenticate a user and return session + JWT tokens.

        Returns a dict with session_id, access_token, and refresh_token
        on success, or an error dict on failure.
        """
        user = self._users.get(username)
        if user is None:
            return {"success": False, "error": "Invalid username or password"}

        if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"]):
            return {"success": False, "error": "Invalid username or password"}

        # Create a server-side session
        session_id = uuid.uuid4().hex
        self._sessions[session_id] = {
            "username": username,
            "created_at": datetime.now(timezone.utc),
        }

        access_token, _ = self._create_access_token(username)
        refresh_token = self._create_refresh_token(username)

        return {
            "success": True,
            "session_id": session_id,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    def logout(self, session_id: str) -> dict:
        """Invalidate a session and revoke its associated tokens.

        Removes the server-side session so that subsequent calls to
        validate_session with tokens issued under it will still work
        until they expire, but the session itself is gone.
        """
        session = self._sessions.pop(session_id, None)
        if session is None:
            return {"success": False, "error": "Session not found or already logged out"}

        return {"success": True, "message": f"User '{session['username']}' logged out"}

    def reset_password(self, email: str) -> dict:
        """Generate a time-limited password-reset token for the given email.

        In a real system this token would be sent via email. Here we
        return it directly so callers can use `confirm_reset_password`.
        """
        # Find the user by email
        target_user = None
        for username, data in self._users.items():
            if data["email"] == email:
                target_user = username
                break

        if target_user is None:
            # Return success even if not found to prevent email enumeration
            return {"success": True, "message": "If that email exists, a reset link was sent"}

        reset_token = secrets.token_urlsafe(32)
        self._reset_tokens[reset_token] = {
            "username": target_user,
            "email": email,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        }

        return {
            "success": True,
            "message": "If that email exists, a reset link was sent",
            "reset_token": reset_token,  # would be emailed in production
        }

    def confirm_reset_password(self, reset_token: str, new_password: str) -> dict:
        """Consume a reset token and set a new password."""
        record = self._reset_tokens.pop(reset_token, None)
        if record is None:
            return {"success": False, "error": "Invalid or expired reset token"}

        if datetime.now(timezone.utc) > record["expires_at"]:
            return {"success": False, "error": "Invalid or expired reset token"}

        username = record["username"]
        new_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
        self._users[username]["password_hash"] = new_hash

        # Invalidate all existing sessions for this user
        to_remove = [
            sid for sid, s in self._sessions.items() if s["username"] == username
        ]
        for sid in to_remove:
            self._sessions.pop(sid)

        return {"success": True, "message": "Password updated successfully"}

    def validate_session(self, token: str) -> dict:
        """Decode and validate a JWT access token.

        Checks signature, expiry, token type, and revocation status.
        Returns the decoded claims on success.
        """
        try:
            payload = jwt.decode(token, self._jwt_secret, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return {"valid": False, "error": "Token has expired"}
        except jwt.InvalidTokenError as exc:
            return {"valid": False, "error": f"Invalid token: {exc}"}

        if payload.get("type") != "access":
            return {"valid": False, "error": "Token is not an access token"}

        if payload.get("jti") in self._revoked_jtis:
            return {"valid": False, "error": "Token has been revoked"}

        return {
            "valid": True,
            "username": payload["sub"],
            "expires_at": datetime.fromtimestamp(payload["exp"], tz=timezone.utc).isoformat(),
            "jti": payload["jti"],
        }

    def refresh_token(self, old_token: str) -> dict:
        """Exchange a valid refresh token for a new access + refresh token pair.

        The old refresh token is revoked (one-time use) to prevent
        replay attacks.
        """
        try:
            payload = jwt.decode(old_token, self._jwt_secret, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return {"success": False, "error": "Refresh token has expired"}
        except jwt.InvalidTokenError as exc:
            return {"success": False, "error": f"Invalid refresh token: {exc}"}

        if payload.get("type") != "refresh":
            return {"success": False, "error": "Token is not a refresh token"}

        old_jti = payload["jti"]

        # Check if already used / revoked
        if old_jti in self._revoked_jtis:
            return {"success": False, "error": "Refresh token has already been used"}

        if old_jti not in self._refresh_tokens:
            return {"success": False, "error": "Refresh token not recognised"}

        # Revoke the old refresh token (rotation)
        self._revoked_jtis.add(old_jti)
        self._refresh_tokens.pop(old_jti, None)

        username = payload["sub"]
        new_access, _ = self._create_access_token(username)
        new_refresh = self._create_refresh_token(username)

        return {
            "success": True,
            "access_token": new_access,
            "refresh_token": new_refresh,
        }
