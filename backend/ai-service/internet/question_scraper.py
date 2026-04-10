import requests
from bs4 import BeautifulSoup

def scrape_questions(topic):
    url = f"https://www.geeksforgeeks.org/{topic.replace(' ','-')}"
    try:
        page = requests.get(url, timeout=5)
        soup = BeautifulSoup(page.text, "html.parser")
        paragraphs = soup.find_all("p")
        text = ""
        for p in paragraphs[:10]:
            text += p.text + "\n"
        return text
    except:
        return ""
