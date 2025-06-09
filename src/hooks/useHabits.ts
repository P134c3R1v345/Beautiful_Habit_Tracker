import { useState, useEffect } from 'react';
import { supabase, type Habit, type HabitCompletion } from '../lib/supabase';

interface HabitWithStats extends Habit {
  streak: number;
  completedDates: string[];
  totalCompletions: number;
}

export function useHabits(userId: string | null) {
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = async () => {
    if (!userId) {
      setHabits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (habitsError) throw habitsError;

      // Fetch all completions for these habits
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId);

      if (completionsError) throw completionsError;

      // Process habits with their completions and streaks
      const habitsWithStats: HabitWithStats[] = await Promise.all(
        (habitsData || []).map(async (habit) => {
          const habitCompletions = (completionsData || [])
            .filter(completion => completion.habit_id === habit.id)
            .map(completion => completion.completed_date);

          // Calculate streak using the database function
          const { data: streakData } = await supabase
            .rpc('calculate_habit_streak', { habit_uuid: habit.id });

          return {
            ...habit,
            streak: streakData || 0,
            completedDates: habitCompletions.sort(),
            totalCompletions: habitCompletions.length
          };
        })
      );

      setHabits(habitsWithStats);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching habits:', err);
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async (name: string, color: string) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            user_id: userId,
            name: name.trim(),
            color
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newHabit: HabitWithStats = {
        ...data,
        streak: 0,
        completedDates: [],
        totalCompletions: 0
      };

      setHabits(prev => [newHabit, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const toggleHabit = async (habitId: string, date: string) => {
    if (!userId) return;

    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const isCompleted = habit.completedDates.includes(date);

      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', habitId)
          .eq('completed_date', date)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase
          .from('habit_completions')
          .insert([
            {
              habit_id: habitId,
              user_id: userId,
              completed_date: date
            }
          ]);

        if (error) throw error;
      }

      // Refresh habits to get updated streaks
      await fetchHabits();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', userId);

      if (error) throw error;

      setHabits(prev => prev.filter(habit => habit.id !== habitId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [userId]);

  return {
    habits,
    loading,
    error,
    addHabit,
    toggleHabit,
    deleteHabit,
    refetch: fetchHabits
  };
}