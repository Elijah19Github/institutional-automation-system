try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

def search_web(topic):
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(topic + " computer science explanation", max_results=5):
                results.append(r.get("body", ""))
        return " ".join(results)
    except:
        return ""
