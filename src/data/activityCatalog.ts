// src/data/activityCatalog.ts
import type { ImageSourcePropType } from "react-native";
import type { ActivityKey } from "../utils/met";

export type ExerciseItem = {
  id: string;
  title: string;
  desc: string;
  image?: ImageSourcePropType;
};

export type ActivityCategory = {
  key: ActivityKey;
  title: string;
  desc: string;
  items: ExerciseItem[];
};

export const ACTIVITY_CATALOG: Record<ActivityKey, ActivityCategory> = {
  // =======================
  // POPULAR
  // =======================
  lifting: {
    key: "lifting",
    title: "Lifting",
    desc: "Strength training",
    items: [
      {
        id: "bench_press",
        title: "Bench press",
        desc: "Chest & triceps",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Bench-press-1.png" },
      },
      {
        id: "deadlift",
        title: "Deadlift",
        desc: "Posterior chain",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/4/47/Dead-lifts-1.png" },
      },
      {
        id: "squat",
        title: "Barbell squat",
        desc: "Legs & core",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Squats-1.png" },
      },
      {
        id: "shoulder_press",
        title: "Shoulder press",
        desc: "Shoulders",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Dumbbell-shoulder-press-1.png" },
      },
      {
        id: "biceps_curl",
        title: "Biceps curl",
        desc: "Arms",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Biceps-curl-1.png" },
      },
      {
        id: "lat_pulldown",
        title: "Lat pulldown",
        desc: "Back",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/0/03/Close-grip-front-lat-pull-down-1.png" },
      },
      {
        id: "dips",
        title: "Dips",
        desc: "Chest & triceps",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Bench-dips-1.png" },
      },
    ],
  },

  aerobic: {
    key: "aerobic",
    title: "Aerobic",
    desc: "Cardio session",
    items: [
      {
        id: "jogging",
        title: "Jogging",
        desc: "Steady cardio",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Jogging_-_man_running.jpg" },
      },
      {
        id: "treadmill",
        title: "Treadmill run",
        desc: "Indoor running",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Treadmill_running.jpg" },
      },
      {
        id: "stair",
        title: "Stair climbing",
        desc: "Legs & cardio",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Stair_climbing_exercise.jpg" },
      },
      {
        id: "rowing",
        title: "Rowing machine",
        desc: "Full body cardio",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Rowing_machine_exercise.png" },
      },
    ],
  },

  swimming: {
    key: "swimming",
    title: "Swimming",
    desc: "Low impact cardio",
    items: [
      {
        id: "freestyle",
        title: "Freestyle",
        desc: "Front crawl",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/5/52/Freestyle_swimming.jpg" },
      },
      {
        id: "breaststroke",
        title: "Breaststroke",
        desc: "Controlled pace",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Breaststroke_swimming.jpg" },
      },
      {
        id: "backstroke",
        title: "Backstroke",
        desc: "Back friendly",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Backstroke_swimming.jpg" },
      },
    ],
  },

  cycling: {
    key: "cycling",
    title: "Cycling",
    desc: "Bike ride",
    items: [
      {
        id: "outdoor_cycling",
        title: "Outdoor cycling",
        desc: "Road or park",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Road_cycling.jpg" },
      },
      {
        id: "indoor_bike",
        title: "Indoor bike",
        desc: "Stationary cycling",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Stationary_bicycle.jpg" },
      },
    ],
  },

  // =======================
  // COLLECTION
  // =======================
  aerobic_exercise: {
    key: "aerobic_exercise",
    title: "Aerobic Exercise",
    desc: "Bodyweight cardio",
    items: [
      {
        id: "jumping_jacks",
        title: "Jumping jacks",
        desc: "Warm-up cardio",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/3/35/A_display_of_Jumping_Jack_Cardio_Exercise_at_Orji_Flyover_Owerri%2C_Imo_State.jpg" },
      },
      {
        id: "high_knees",
        title: "High knees",
        desc: "Raise heart rate",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/4/4e/High_knees.gif" },
      },
      {
        id: "mountain_climbers",
        title: "Mountain climbers",
        desc: "Cardio + core",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/0/09/Mountain_Climbers.gif" },
      },
      {
        id: "burpees",
        title: "Burpees",
        desc: "Full body cardio",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Burpee_5_Thrust.jpg" },
      },
    ],
  },

  resistance_training: {
    key: "resistance_training",
    title: "Resistance Training",
    desc: "Strength & muscle",
    items: [
      {
        id: "push_up",
        title: "Push-up",
        desc: "Chest & arms",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Pushups.jpg" },
      },
      {
        id: "body_squat",
        title: "Bodyweight squat",
        desc: "Leg strength",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Air_squat.jpg" },
      },
      {
        id: "lunge",
        title: "Lunges",
        desc: "Legs & glutes",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/5/55/Lunges-1.png" },
      },
      {
        id: "plank",
        title: "Plank",
        desc: "Core stability",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Plank_exercise.jpg" },
      },
    ],
  },

  flexibility_exercise: {
    key: "flexibility_exercise",
    title: "Flexibility Exercise",
    desc: "Stretching",
    items: [
      {
        id: "hamstring",
        title: "Hamstring stretch",
        desc: "Back of legs",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Hamstring_stretch.jpg" },
      },
      {
        id: "quad",
        title: "Quad stretch",
        desc: "Front thighs",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/6/69/Quadriceps_stretch.jpg" },
      },
      {
        id: "cobra",
        title: "Cobra stretch",
        desc: "Spine extension",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Cobra_yoga_pose.jpg" },
      },
    ],
  },

  balance_exercise: {
    key: "balance_exercise",
    title: "Balance Exercise",
    desc: "Stability",
    items: [
      {
        id: "single_leg",
        title: "Single-leg stand",
        desc: "Basic balance",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Single_leg_stand.jpg" },
      },
      {
        id: "tree_pose",
        title: "Tree pose",
        desc: "Yoga balance",
        image: { uri: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Tree_pose.jpg" },
      },
    ],
  },
};

export function getExercises(key: ActivityKey): ExerciseItem[] {
  return ACTIVITY_CATALOG[key]?.items ?? [];
}

export function getExerciseCount(key: ActivityKey): number {
  return getExercises(key).length;
}
