import requests

api_key = "sk-abc123def456ghi789jkl012mno345pqr678"

def fetch_data():
    response = requests.get(
        "https://api.example.com/data",
        headers={"Authorization": f"Bearer {api_key}"}
    )
    return response.json()
