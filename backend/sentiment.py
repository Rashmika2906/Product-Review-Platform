"""Sentiment analysis with VADER."""
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer


def _load_analyzer():
    try:
        return SentimentIntensityAnalyzer()
    except LookupError:
        nltk.download("vader_lexicon", quiet=True)
        return SentimentIntensityAnalyzer()


_analyzer = _load_analyzer()  # built once when the app starts, then reused

# Standard VADER cut-offs on the compound score (-1 = very negative, +1 = very positive)
POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05


def analyze_sentiment(text):
    """Return 'positive', 'negative' or 'neutral' for a piece of review text."""
    compound = _analyzer.polarity_scores(text)["compound"]
    if compound >= POSITIVE_THRESHOLD:
        return "positive"
    if compound <= NEGATIVE_THRESHOLD:
        return "negative"
    return "neutral"