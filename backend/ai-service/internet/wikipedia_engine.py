import wikipedia

def get_wikipedia_content(topic):
    try:
        summary = wikipedia.summary(topic, sentences=5)
        return summary
    except:
        return ""
