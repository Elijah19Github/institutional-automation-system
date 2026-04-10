from internet.wikipedia_engine import get_wikipedia_content
from internet.search_engine import search_web
from internet.question_scraper import scrape_questions

def build_context(topic, textbook_context):
    wiki = get_wikipedia_content(topic)
    web = search_web(topic)
    scraped = scrape_questions(topic)

    context = f"""
Textbook Content:
{textbook_context}

Wikipedia Content:
{wiki}

Web Content:
{web}

Educational Website Content (GeeksforGeeks):
{scraped}
"""
    return context
