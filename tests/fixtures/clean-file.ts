interface User {
  id: string;
  name: string;
  email: string;
}

function validateEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

async function getUser(id: string): Promise<User | null> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export { validateEmail, getUser };
export type { User };
