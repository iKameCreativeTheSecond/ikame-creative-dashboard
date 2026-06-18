type Weekday =
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday";

const weekdayIndex: Record<Weekday, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

export function compareTodayTo(day: Weekday, today = new Date()):
    | "before"
    | "same"
    | "after" {
    const todayIndex = today.getDay();
    const targetIndex = weekdayIndex[day];

    if (todayIndex < targetIndex) return "before";
    if (todayIndex > targetIndex) return "after";
    return "same";
}

export function isTodayBefore(day: Weekday, today = new Date()): boolean {
    return today.getDay() < weekdayIndex[day];
}

export function isTodayAfter(day: Weekday, today = new Date()): boolean {
    return today.getDay() > weekdayIndex[day];
}