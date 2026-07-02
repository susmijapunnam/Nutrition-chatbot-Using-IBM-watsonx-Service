"""
nutrition_tools.py — Utility functions for nutrition calculations.
No external API calls; pure Python math used as tools by the agent.
"""
from __future__ import annotations
import math


# ─── BMI ────────────────────────────────────────────────────────────────────

def calculate_bmi(weight_kg: float, height_cm: float) -> dict:
    """Return BMI value, category, and colour indicator."""
    height_m = height_cm / 100
    bmi = round(weight_kg / (height_m ** 2), 1)

    if bmi < 18.5:
        category = "Underweight"
        color = "info"
        advice = (
            "You are below the healthy weight range. Focus on nutrient-dense, "
            "calorie-rich foods like nuts, seeds, whole grains, legumes, and dairy."
        )
    elif bmi < 25:
        category = "Normal weight"
        color = "success"
        advice = (
            "Great! You are in the healthy weight range. "
            "Maintain a balanced diet and regular physical activity."
        )
    elif bmi < 30:
        category = "Overweight"
        color = "warning"
        advice = (
            "You are slightly above the healthy range. "
            "Aim for a moderate calorie deficit (~300–500 kcal/day) through balanced meals and exercise."
        )
    else:
        category = "Obese"
        color = "danger"
        advice = (
            "Please consult a doctor or registered dietitian for a personalised weight-loss plan. "
            "Small, sustainable changes in diet and activity make a big difference."
        )

    return {"bmi": bmi, "category": category, "color": color, "advice": advice}


# ─── CALORIE NEEDS (Mifflin-St Jeor) ────────────────────────────────────────

ACTIVITY_MULTIPLIERS = {
    "sedentary":       1.2,
    "lightly_active":  1.375,
    "moderately_active": 1.55,
    "very_active":     1.725,
    "extra_active":    1.9,
}

ACTIVITY_LABELS = {
    "sedentary":         "Sedentary (little or no exercise)",
    "lightly_active":    "Lightly active (1–3 days/week)",
    "moderately_active": "Moderately active (3–5 days/week)",
    "very_active":       "Very active (6–7 days/week)",
    "extra_active":      "Extra active (physical job or 2× training)",
}


def calculate_tdee(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,          # "male" or "female"
    activity: str = "moderately_active",
    goal: str = "maintain",   # "lose", "maintain", "gain"
) -> dict:
    """Return BMR, TDEE, and goal-adjusted calorie target with macros."""
    # Mifflin-St Jeor BMR
    if gender.lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    multiplier = ACTIVITY_MULTIPLIERS.get(activity, 1.55)
    tdee = round(bmr * multiplier)

    if goal == "lose":
        target = max(1200, tdee - 500)
        goal_label = "Weight loss (−500 kcal/day deficit)"
    elif goal == "gain":
        target = tdee + 300
        goal_label = "Muscle gain (+300 kcal/day surplus)"
    else:
        target = tdee
        goal_label = "Weight maintenance"

    # Macro split (protein 30%, carbs 45%, fat 25%)
    protein_g  = round(target * 0.30 / 4)
    carbs_g    = round(target * 0.45 / 4)
    fat_g      = round(target * 0.25 / 9)

    return {
        "bmr": round(bmr),
        "tdee": tdee,
        "target_calories": target,
        "goal_label": goal_label,
        "activity_label": ACTIVITY_LABELS.get(activity, activity),
        "macros": {
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fat_g": fat_g,
        },
    }


# ─── FAMILY CALORIE QUICK GUIDE ─────────────────────────────────────────────

def family_calorie_guide(members: list[dict]) -> list[dict]:
    """
    Given a list of family member dicts with keys:
      name, age, gender, weight_kg, height_cm, activity, goal
    Return enriched dicts with BMI + TDEE added.
    """
    results = []
    for m in members:
        try:
            bmi_data  = calculate_bmi(float(m["weight_kg"]), float(m["height_cm"]))
            tdee_data = calculate_tdee(
                weight_kg  = float(m["weight_kg"]),
                height_cm  = float(m["height_cm"]),
                age        = int(m["age"]),
                gender     = m.get("gender", "female"),
                activity   = m.get("activity", "moderately_active"),
                goal       = m.get("goal", "maintain"),
            )
            results.append({**m, "bmi": bmi_data, "tdee": tdee_data})
        except Exception as exc:
            results.append({**m, "error": str(exc)})
    return results


# ─── SIMPLE CALORIE ESTIMATOR (text-based) ───────────────────────────────────

FOOD_CALORIES_PER_100G: dict[str, float] = {
    # Grains
    "rice":          130, "brown rice": 111, "chapati": 297, "roti": 297,
    "bread":         265, "oats":       389, "poha":    110, "upma":    130,
    "idli":           39, "dosa":       168, "millet":  378,
    # Proteins
    "chicken":       165, "egg":        155, "fish":    136, "tofu":     76,
    "paneer":        265, "dal":        116, "rajma":   127, "chole":   164,
    "moong":         347, "soya":       446,
    # Vegetables
    "spinach":        23, "broccoli":    34, "carrot":   41, "tomato":   18,
    "potato":         77, "onion":       40, "cauliflower": 25, "capsicum": 31,
    # Fruits
    "apple":          52, "banana":      89, "mango":    60, "orange":   47,
    "grapes":         67, "papaya":      43, "guava":    68,
    # Dairy
    "milk":           42, "curd":        60, "butter":  717, "ghee":    900,
    "cheese":        402, "paneer":     265,
    # Nuts & Seeds
    "almonds":       579, "walnuts":    654, "peanuts": 567, "cashew":  553,
    "sunflower seeds": 584, "sesame":  573, "flaxseed": 534,
    # Oils
    "oil":           884, "olive oil":  884, "coconut oil": 862,
}


def estimate_calories(food_name: str, quantity_g: float) -> dict:
    """Rough calorie estimate from the local lookup table."""
    key = food_name.strip().lower()
    cal_per_100 = FOOD_CALORIES_PER_100G.get(key)
    if cal_per_100 is None:
        # fuzzy fallback: substring match
        for k, v in FOOD_CALORIES_PER_100G.items():
            if k in key or key in k:
                cal_per_100 = v
                key = k
                break
    if cal_per_100 is None:
        return {"error": f"'{food_name}' not in local database. Ask the AI for an estimate."}

    calories = round(cal_per_100 * quantity_g / 100)
    return {
        "food": key,
        "quantity_g": quantity_g,
        "calories_kcal": calories,
        "note": "Approximate value — actual may vary by preparation method.",
    }
