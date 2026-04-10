from __future__ import annotations

from dataclasses import dataclass
import re


@dataclass(frozen=True)
class ChatReply:
    reply: str
    category: str
    suggestions: list[str]


FALLBACK_SUGGESTIONS = [
    "What is diabetes?",
    "How can I reduce heart disease risk?",
    "What is the full form of BMI?",
    "Suggest a healthy diet plan",
]


def _normalize(message: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", message).lower()
    return re.sub(r"\s+", " ", cleaned).strip()


def _contains_phrase(message: str, phrases: list[str]) -> bool:
    return any(phrase in message for phrase in phrases)


def _question_type(message: str) -> str:
    if _contains_phrase(message, ["full form", "stands for", "meaning of"]):
        return "definition"
    if _contains_phrase(message, ["how to", "how do i", "how can i", "reduce", "prevent", "avoid", "improve"]):
        return "action"
    if _contains_phrase(message, ["symptom", "sign", "warning", "cause"]):
        return "symptoms"
    if _contains_phrase(message, ["diet", "food", "eat", "meal"]):
        return "diet"
    if _contains_phrase(message, ["exercise", "workout", "walking", "fitness"]):
        return "exercise"
    return "general"


def _greeting_reply() -> ChatReply:
    return ChatReply(
        reply=(
            "Hello. I'm your AI Health Assistant. Ask me about diabetes, heart disease, BMI, diet, exercise, lifestyle, "
            "or what your risk score means."
        ),
        category="general",
        suggestions=FALLBACK_SUGGESTIONS,
    )


def _gratitude_reply() -> ChatReply:
    return ChatReply(
        reply="You're welcome. If you want, ask me anything about your health score, BMI, diet, or disease risk.",
        category="general",
        suggestions=[
            "Explain my health score",
            "What is the full form of BMI?",
            "How can I reduce heart disease risk?",
        ],
    )


def _acknowledgement_reply() -> ChatReply:
    return ChatReply(
        reply="Okay. I'm here whenever you want to ask another health question.",
        category="general",
        suggestions=FALLBACK_SUGGESTIONS,
    )


def _farewell_reply() -> ChatReply:
    return ChatReply(
        reply="Take care. You can come back anytime if you want help with symptoms, BMI, diet, exercise, or prediction results.",
        category="general",
        suggestions=FALLBACK_SUGGESTIONS,
    )


def _small_talk_reply(message: str) -> ChatReply | None:
    words = set(message.split())

    greeting_tokens = {"gm", "ge", "ga", "hello", "hi", "hey"}
    greeting_phrases = ["good morning", "good mrng", "good morn", "good evening", "good afternoon"]
    thanks_tokens = {"tq", "ty", "thx", "thanks"}
    thanks_phrases = ["thank you", "thanks a lot", "thank u"]
    ack_tokens = {"ok", "okay", "kk", "hmm", "hmmm", "alright", "fine"}
    bye_tokens = {"bye", "goodbye", "gn", "cya"}
    bye_phrases = ["see you", "see u", "good night", "catch you later"]

    has_greeting = bool(words & greeting_tokens) or _contains_phrase(message, greeting_phrases)
    has_thanks = bool(words & thanks_tokens) or _contains_phrase(message, thanks_phrases)
    has_ack = bool(words & ack_tokens)
    has_bye = bool(words & bye_tokens) or _contains_phrase(message, bye_phrases)

    if has_greeting and has_thanks and has_bye:
        return ChatReply(
            reply="Good to hear from you. You're welcome, and take care. I'm here whenever you need health guidance again.",
            category="general",
            suggestions=FALLBACK_SUGGESTIONS,
        )

    if has_greeting and has_thanks:
        return ChatReply(
            reply="Good to hear from you. You're welcome. Ask me anytime if you want help with BMI, diet, risks, or disease information.",
            category="general",
            suggestions=FALLBACK_SUGGESTIONS,
        )

    if has_bye and has_thanks:
        return ChatReply(
            reply="You're welcome. Take care, and come back anytime if you want more health help.",
            category="general",
            suggestions=FALLBACK_SUGGESTIONS,
        )

    if has_greeting:
        return ChatReply(
            reply="Good to hear from you. How can I help you today with your health questions?",
            category="general",
            suggestions=FALLBACK_SUGGESTIONS,
        )

    if has_thanks:
        return _gratitude_reply()

    if has_bye:
        return _farewell_reply()

    if has_ack:
        return _acknowledgement_reply()

    return None


def _bmi_reply(question_type: str) -> ChatReply:
    if question_type == "definition":
        reply = (
            "BMI stands for Body Mass Index. It is a simple number calculated from your height and weight to estimate "
            "whether your body weight is in a healthy range."
        )
    elif question_type == "action":
        reply = (
            "To improve BMI, focus on steady habits rather than quick fixes. If BMI is high, reduce sugary drinks, "
            "eat more whole foods, and stay active. If BMI is low, increase nutritious calories with protein, dairy, "
            "nuts, legumes, and regular meals."
        )
    else:
        reply = (
            "BMI means Body Mass Index. It helps estimate whether your weight is low, healthy, high, or very high for "
            "your height. A BMI under 18.5 is underweight, 18.5 to 24.9 is usually healthy, 25 to 29.9 is overweight, "
            "and 30 or above suggests obesity. It is a screening tool, not a full diagnosis."
        )
    return ChatReply(
        reply=reply,
        category="bmi",
        suggestions=[
            "How can I improve my BMI?",
            "Does BMI always reflect real health?",
            "What is a healthy weight range?",
        ],
    )


def _diabetes_reply(question_type: str) -> ChatReply:
    if question_type == "definition":
        reply = (
            "Diabetes is a condition where blood sugar becomes too high because the body does not make enough insulin "
            "or cannot use insulin properly."
        )
    elif question_type == "action":
        reply = (
            "To lower diabetes risk, reduce sugary drinks and excess sweets, choose high-fiber foods, walk or exercise "
            "regularly, maintain a healthy weight, sleep well, and monitor glucose if your doctor recommends it."
        )
    elif question_type == "symptoms":
        reply = (
            "Common diabetes symptoms include increased thirst, frequent urination, tiredness, blurred vision, slow "
            "healing wounds, and unexplained weight changes."
        )
    elif question_type == "diet":
        reply = (
            "For diabetes-friendly eating, choose vegetables, whole grains, pulses, eggs, lean protein, curd, nuts, "
            "and controlled portions of fruit. Try to limit sweets, white bread, sugary tea or coffee, and sweet drinks."
        )
    else:
        reply = (
            "Diabetes affects how your body handles blood sugar. Good control usually depends on balanced eating, "
            "daily movement, healthy weight, stress control, and medical follow-up when needed."
        )
    return ChatReply(
        reply=reply,
        category="diabetes",
        suggestions=[
            "What foods help control blood sugar?",
            "What are common diabetes symptoms?",
            "Can exercise lower diabetes risk?",
        ],
    )


def _heart_reply(question_type: str) -> ChatReply:
    if question_type == "definition":
        reply = (
            "Heart disease is a broad term for problems affecting the heart and blood vessels, including blocked "
            "arteries, weak heart function, or rhythm problems."
        )
    elif question_type == "action":
        reply = (
            "To reduce heart disease risk, cut down excess salt and fried food, avoid smoking, stay active, manage "
            "blood pressure and cholesterol, sleep well, and keep stress under control."
        )
    elif question_type == "diet":
        reply = (
            "A heart-friendly diet includes vegetables, fruit, oats, dal, nuts, seeds, fish or lean protein, and less "
            "salt, processed meats, bakery snacks, and repeated deep-fried foods."
        )
    elif question_type == "symptoms":
        reply = (
            "Possible heart warning signs include chest pain, chest pressure, shortness of breath, unusual sweating, "
            "pain spreading to the arm or jaw, dizziness, and sudden fatigue."
        )
    else:
        reply = (
            "Heart disease risk often rises with high blood pressure, smoking, diabetes, high cholesterol, low activity, "
            "and chronic stress. Good routines can reduce that risk meaningfully."
        )
    return ChatReply(
        reply=reply,
        category="heart",
        suggestions=[
            "How do I reduce heart disease risk?",
            "What foods are good for heart health?",
            "What are warning signs of heart disease?",
        ],
    )


def _kidney_reply(question_type: str) -> ChatReply:
    if question_type == "action":
        reply = (
            "To protect kidney health, stay hydrated, manage blood pressure and diabetes carefully, avoid unnecessary "
            "painkiller use, and reduce very salty packaged foods."
        )
    elif question_type == "symptoms":
        reply = (
            "Kidney disease may cause swelling in the feet, foamy urine, fatigue, nausea, poor appetite, or reduced urine output."
        )
    else:
        reply = (
            "Kidney disease affects the body's ability to filter waste and balance fluids. It is strongly linked to "
            "blood pressure, diabetes, hydration, and medication habits."
        )
    return ChatReply(
        reply=reply,
        category="kidney",
        suggestions=[
            "How can I improve kidney health?",
            "What are early kidney disease signs?",
            "How much water should I drink daily?",
        ],
    )


def _liver_reply(question_type: str) -> ChatReply:
    if question_type == "action":
        reply = (
            "To lower liver disease risk, avoid excess alcohol, reduce oily processed foods, maintain a healthy weight, "
            "exercise consistently, and control diabetes if present."
        )
    elif question_type == "symptoms":
        reply = (
            "Liver problems can show up as tiredness, yellow eyes or skin, dark urine, swelling, nausea, or discomfort "
            "in the upper right abdomen."
        )
    elif question_type == "diet":
        reply = (
            "For liver health, choose vegetables, fruit, whole grains, dal, curd, lean protein, and less fried food, "
            "alcohol, and high-sugar packaged snacks."
        )
    else:
        reply = (
            "Liver disease includes conditions like fatty liver, hepatitis, and liver inflammation. Weight control, "
            "less alcohol, and healthier food choices help a lot."
        )
    return ChatReply(
        reply=reply,
        category="liver",
        suggestions=[
            "How can I reduce fatty liver risk?",
            "What foods support liver health?",
            "What are liver disease symptoms?",
        ],
    )


def _lung_reply(question_type: str) -> ChatReply:
    if question_type == "action":
        reply = (
            "To improve lung health, avoid smoking, walk regularly, practice breathing exercises, reduce dust exposure "
            "when possible, and treat allergies or infections early."
        )
    elif question_type == "symptoms":
        reply = (
            "Common lung disease symptoms include chronic cough, wheezing, breathlessness, chest tightness, and low exercise tolerance."
        )
    else:
        reply = (
            "Lung disease affects breathing and oxygen exchange. Smoking, pollution exposure, untreated infections, and "
            "allergies can all increase risk."
        )
    return ChatReply(
        reply=reply,
        category="lung",
        suggestions=[
            "How do I improve lung health?",
            "What are common lung disease symptoms?",
            "Can exercise help breathing capacity?",
        ],
    )


def _diet_reply() -> ChatReply:
    return ChatReply(
        reply=(
            "A strong everyday diet is simple: half the plate vegetables, one quarter protein, one quarter whole grains "
            "or millets, plus enough water. Reduce sugary drinks, packaged snacks, extra salt, and repeated fried food."
        ),
        category="diet",
        suggestions=[
            "Suggest a healthy meal plan",
            "What foods reduce sugar intake?",
            "How do I eat for heart health?",
        ],
    )


def _exercise_reply() -> ChatReply:
    return ChatReply(
        reply=(
            "A practical weekly exercise target is at least 150 minutes of brisk walking, cycling, or similar moderate "
            "activity, plus 2 days of strength work. Even 20 to 30 minutes a day helps."
        ),
        category="exercise",
        suggestions=[
            "Give me a beginner exercise plan",
            "How much walking is enough daily?",
            "Can exercise lower diabetes risk?",
        ],
    )


def _lifestyle_reply() -> ChatReply:
    return ChatReply(
        reply=(
            "Healthy lifestyle habits include regular sleep, movement, stress management, no smoking, limited alcohol, "
            "good hydration, and regular health checkups. Consistency matters more than perfection."
        ),
        category="lifestyle",
        suggestions=[
            "How can I improve sleep quality?",
            "How do I reduce stress naturally?",
            "What daily habits improve health?",
        ],
    )


def _risk_reply() -> ChatReply:
    return ChatReply(
        reply=(
            "A risk percentage is not a diagnosis. It estimates how likely a condition may be based on the details you entered. "
            "Lower percentages usually mean lower risk. The health score is your overall combined wellness score from 0 to 100."
        ),
        category="risk",
        suggestions=[
            "Explain health score in simple words",
            "Why can risk be low but not zero?",
            "How do I improve my health score?",
        ],
    )


def generate_response(message: str) -> ChatReply:
    normalized = _normalize(message)
    question_type = _question_type(normalized)

    if not normalized:
        return _greeting_reply()

    small_talk = _small_talk_reply(normalized)
    if small_talk is not None:
        return small_talk

    if _contains_phrase(normalized, ["bmi", "body mass index", "healthy weight", "weight range"]):
        return _bmi_reply(question_type)

    if _contains_phrase(normalized, ["diabetes", "blood sugar", "glucose", "insulin"]):
        return _diabetes_reply(question_type)

    if _contains_phrase(normalized, ["heart", "cardiac", "cholesterol", "blood pressure", "hypertension"]):
        return _heart_reply(question_type)

    if _contains_phrase(normalized, ["kidney", "creatinine", "urine", "hydration"]):
        return _kidney_reply(question_type)

    if _contains_phrase(normalized, ["liver", "fatty liver", "hepatitis", "alcohol"]):
        return _liver_reply(question_type)

    if _contains_phrase(normalized, ["lung", "breathing", "shortness of breath", "smoking", "respiratory"]):
        return _lung_reply(question_type)

    if _contains_phrase(normalized, ["diet", "food", "meal", "nutrition", "eat"]):
        return _diet_reply()

    if _contains_phrase(normalized, ["exercise", "workout", "walk", "fitness", "activity"]):
        return _exercise_reply()

    if _contains_phrase(normalized, ["lifestyle", "sleep", "stress", "habit", "routine"]):
        return _lifestyle_reply()

    if _contains_phrase(normalized, ["risk", "prediction", "probability", "score", "health score"]):
        return _risk_reply()

    return ChatReply(
        reply=(
            "I can answer both casual and health-related questions. Try something like 'gm', 'thanks', "
            "'what is diabetes', 'full form of BMI', or 'how do I lower heart disease risk'."
        ),
        category="general",
        suggestions=FALLBACK_SUGGESTIONS,
    )


def process_message(message: str) -> dict:
    response = generate_response(message)
    return {
        "reply": response.reply,
        "category": response.category,
        "suggestions": response.suggestions,
    }
