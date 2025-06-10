import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Target, Calendar, TrendingUp, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useHabits } from './hooks/useHabits';
import AuthForm from './components/AuthForm';
import type { User } from '@supabase/supabase-js';

const HABIT_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);
  const [showAddForm, setShowAddForm] = useState(false);

  const { habits, loading: habitsLoading, error, addHabit, toggleHabit, deleteHabit } = useHabits(user?.id || null);

  const today = new Date().toISOString().split('T')[0];

  // Check for existing session and listen for auth changes
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddHabit = async () => {
    if (newHabitName.trim()) {
      try {
        await addHabit(newHabitName, selectedColor);
        setNewHabitName('');
        setSelectedColor(HABIT_COLORS[0]);
        setShowAddForm(false);
      } catch (err) {
        console.error('Error adding habit:', err);
      }
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    try {
      await toggleHabit(habitId, today);
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId);
    } catch (err) {
      console.error('Error deleting habit:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl shadow-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Target className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading HabitFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  const totalHabits = habits.length;
  const completedToday = habits.filter(habit => habit.completedDates.includes(today)).length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Bolt.new Badge */}
      <div className="fixed top-4 right-4 z-50">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-105"
        >
          <img 
            src="/black_circle_360x360.png" 
            alt="Built with Bolt.new" 
            className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-lg"
          />
        </a>
      </div>

      {/* User Menu */}
      <div className="fixed top-4 left-4 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-xs font-medium text-gray-700 border border-gray-200">
            {user.email}
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-gray-700 hover:bg-white transition-colors border border-gray-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              HabitFlow
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Build better habits, one day at a time</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{completedToday}/{totalHabits}</p>
                <p className="text-sm text-gray-600">Completed Today</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{completionRate}%</p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalHabits}</p>
                <p className="text-sm text-gray-600">Total Habits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Add Habit Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-8 p-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Habit
          </button>
        )}

        {/* Add Habit Form */}
        {showAddForm && (
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Habit</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g., Drink 8 glasses of water"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {HABIT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full transition-all duration-200 ${
                        selectedColor === color 
                          ? 'ring-4 ring-gray-300 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddHabit}
                  disabled={!newHabitName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                >
                  Add Habit
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewHabitName('');
                    setSelectedColor(HABIT_COLORS[0]);
                  }}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {habitsLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your habits...</p>
          </div>
        )}

        {/* Habits List */}
        {!habitsLoading && (
          <div className="space-y-4">
            {habits.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No habits yet</h3>
                <p className="text-gray-500">Add your first habit to get started on your journey!</p>
              </div>
            ) : (
              habits.map((habit) => {
                const isCompletedToday = habit.completedDates.includes(today);
                return (
                  <div
                    key={habit.id}
                    className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 transition-all duration-200 hover:shadow-xl ${
                      isCompletedToday ? 'ring-2 ring-green-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleHabit(habit.id)}
                        className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 transition-all duration-200 flex items-center justify-center ${
                          isCompletedToday
                            ? 'bg-green-500 border-green-500 scale-110'
                            : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                        }`}
                        style={{
                          backgroundColor: isCompletedToday ? habit.color : 'transparent',
                          borderColor: isCompletedToday ? habit.color : '#D1D5DB'
                        }}
                      >
                        {isCompletedToday && <Check className="w-6 h-6 text-white" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-lg ${
                          isCompletedToday ? 'text-green-800 line-through' : 'text-gray-800'
                        }`}>
                          {habit.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-600">
                            🔥 {habit.streak} day streak
                          </p>
                          <p className="text-sm text-gray-600">
                            📅 {habit.totalCompletions} total completions
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Keep going! Every small step counts towards building better habits. 💪
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;