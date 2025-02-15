import requests

url = "https://api.github.com/repos/phillipyan300/GitInsight/commits"
headers = {"Accept": "application/vnd.github.v3+json"}

response = requests.get(url, headers=headers)
commits = response.json()

# Print each commit message
for commit in commits:
    print(commit['commit']['message'])
