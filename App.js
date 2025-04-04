import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  CheckBox,
  Image,
  ScrollView,
  Switch,
  Animated,
  Platform 
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { AdMobBanner } from 'expo-ads-admob';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logo from './assets/prime-logo.png';


const successMessages = [
  "You're unstoppable!", "Keep crushing it!", "Power through like a pro!",
  "Discipline = freedom!", "One more day closer!", "Amazing progress!",
  "This is your time!", "Keep building momentum!", "You’ve got this!",
  "Proud of your grind!", "Strong effort!", "Way to stay committed!",
  "You are becoming elite!", "The future is earned!", "Consistency wins!"
];

const missedMessages = [
  "It's okay. Get back at it tomorrow!", "Every champion stumbles. Keep going.",
  "Reset. Refocus. Reignite.", "Don’t quit. The reward is worth it.",
  "One day won’t define you.", "No shame. You’re still on the path.",
  "Today is a new start!", "You’re human — keep going.",
  "Every great comeback starts here.", "Small steps still matter.",
  "Just keep walking.", "Fall 7 times, stand up 8.",
  "Shake it off. Go again.", "Your next win is coming.", "Let’s get back on track!"
];

export default function App() {
  const [fadeAnim] = useState(new Animated.Value(0)); // Start invisible

  const [screen, setScreen] = useState('splash');
  const [goals, setGoals] = useState([]);
const [selectedGoalId, setSelectedGoalId] = useState(null);
const [inputGoal, setInputGoal] = useState({ name: '', days: '', dailyGoals: [] });
const [editGoal, setEditGoal] = useState(null);
const [message, setMessage] = useState('');
const [darkMode, setDarkMode] = useState(true);
const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
const [todayIndex, setTodayIndex] = useState(null);
const getCurrentGoal = () => goals.find(goal => goal.id === selectedGoalId);
const [settingsSaved, setSettingsSaved] = useState(false);

useEffect(() => {
  Animated.sequence([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500, // fade in
      useNativeDriver: true,
    }),
    Animated.delay(1500), // wait fully visible
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1000, // fade out
      useNativeDriver: true,
    })
  ]).start(() => {
    const run = async () => {
      const storedGoals = await AsyncStorage.getItem('goals');
      const parsedGoals = JSON.parse(storedGoals) || [];
      setGoals(parsedGoals);

      if (parsedGoals.length > 0) {
        setScreen('selectGoal');
      } else {
        setScreen('setup');
      }
    };

    run();
  });
}, [fadeAnim]);






  const recalculateStreak = (list) => {
    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    let count = 0;
    for (const log of sorted) {
      if (log.success) count++;
      else break;
    }
    return count;
  };

  const calculateRemainingDays = (list, original) => {
    let days = original;
    list.forEach(item => {
      if (item.success) days -= 1;
      else days += 2;
    });
    return days;
  };
  const saveReward = async () => {
  const { name, days } = inputGoal;
  if (name && days) {
    const newGoal = {
      id: Date.now().toString(),
      rewardName: name,
      originalDays: parseInt(days),
      daysRemaining: parseInt(days),
      streak: 0,
      history: [],
      dailyGoals: [
        { key: 'calories', name: 'Calories goal met', checked: false },
        { key: 'steps', name: 'Steps goal met', checked: false },
        { key: 'workout', name: 'Workout completed', checked: false },
      ]
    };

    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    setSelectedGoalId(newGoal.id);
    await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
    setScreen('log');
  }
};


  const openSettings = () => {
    setScreen('settings');
  };

const saveSettings = async () => {
  await AsyncStorage.setItem('darkMode', darkMode.toString());
  setSettingsSaved(true); // Show success message

  // After 1.5 seconds, hide message and return to log screen
  setTimeout(() => {
    setSettingsSaved(false);
    setScreen('log');
  }, 800);
};



const checkDuplicateSubmission = () => {
  const today = new Date().toISOString().split('T')[0];
  const goal = getCurrentGoal();
  if (!goal) return;

  const index = goal.history.findIndex(item => item.date === today);
  if (index >= 0) {
    setTodayIndex(index);
    setShowUpdatePrompt(true);
  } else {
    handleSubmit(today);
  }
};


const handleSubmit = async (date, isUpdate = false) => {
  const goal = getCurrentGoal();
  if (!goal) return;

  const wasSuccess = goal.dailyGoals.every(g => g.checked);

  const newHistory = [...goal.history];
  const newLog = { date, success: wasSuccess };

  if (isUpdate && todayIndex !== null) {
    newHistory[todayIndex] = newLog;
  } else {
    newHistory.push(newLog);
  }

  const newStreak = recalculateStreak(newHistory);
  const newDaysRemaining = calculateRemainingDays(newHistory, goal.originalDays);

  const updatedGoals = goals.map(g => {
    if (g.id === selectedGoalId) {
      return {
        ...g,
        history: newHistory,
        streak: newStreak,
        daysRemaining: newDaysRemaining,
        dailyGoals: g.dailyGoals.map(goal => ({ ...goal, checked: false }))
      };
    }
    return g;
  });

  setGoals(updatedGoals);
  await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));

  setShowUpdatePrompt(false);
  setTodayIndex(null);

  setMessage(wasSuccess
    ? successMessages[Math.floor(Math.random() * successMessages.length)]
    : missedMessages[Math.floor(Math.random() * missedMessages.length)]
  );

  if (newDaysRemaining <= 0) setScreen('congrats');
};



const deleteEntry = async (index) => {
  const goal = getCurrentGoal();
  if (!goal) return;

  const updatedHistory = [...goal.history];
  updatedHistory.splice(index, 1);

  const newStreak = recalculateStreak(updatedHistory);
  const newDaysRemaining = calculateRemainingDays(updatedHistory, goal.originalDays);

  const updatedGoals = goals.map(g => {
    if (g.id === selectedGoalId) {
      return {
        ...g,
        history: updatedHistory,
        streak: newStreak,
        daysRemaining: newDaysRemaining
      };
    }
    return g;
  });

  setGoals(updatedGoals);
  await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
};



const editEntry = (entry) => {
  const goal = getCurrentGoal();
  if (!goal) return;

  const updatedGoals = goals.map(g => {
    if (g.id === selectedGoalId) {
      return {
        ...g,
        dailyGoals: g.dailyGoals.map(goal => ({ ...goal, checked: entry.success }))
      };
    }
    return g;
  });

  setGoals(updatedGoals);
  setTodayIndex(goal.history.findIndex(e => e.date === entry.date));
  setShowUpdatePrompt(true);
};



  const handleNewRewardDecision = async (choice) => {
    if (choice === 'yes') {
      await AsyncStorage.clear();
setInputGoal({ name: '', days: '', dailyGoals: [] });

      setScreen('setup');
    } else {
      await AsyncStorage.setItem('askAgain', 'true');
      setAskAgain(true);
    }
  };
if (screen === 'splash') {
  return (
<View style={darkMode ? styles.splash : styles.splashLight}>

      <Animated.Image
  source={logo}
  style={[styles.headerLogo, { opacity: fadeAnim }]}
  resizeMode="contain"
/>

      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}

  if (showUpdatePrompt) {
    return (
      <View style={darkMode ? styles.container : styles.containerLight}>
        <Text style={[styles.header, { color: darkMode ? 'white' : 'black' }]}>Already Submitted</Text>
        <Text style={[styles.text, { color: darkMode ? 'white' : 'black' }]}>
          You have already submitted today. Would you like to update your daily log with the new values?
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => handleSubmit(new Date().toISOString().split('T')[0], true)}>
        <Text style={styles.buttonText}>Yes, update it</Text>
        </TouchableOpacity>
        <View style={{ marginTop: 10 }} />
                <TouchableOpacity style={styles.button} onPress={() => setShowUpdatePrompt(false)}>
        <Text style={styles.buttonText}>No, go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'setup') {
    return (
      <View style={darkMode ? styles.container : styles.containerLight}>
      <View style={styles.headerContainer}>
  <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
</View>
        <Text style={[styles.header, { color: darkMode ? 'white' : 'black' }]}>Set Your Reward</Text>
        <TextInput
          style={[styles.input, { color: darkMode ? 'white' : 'black' }]}
          placeholder="Enter reward name"
          placeholderTextColor="#aaa"
value={inputGoal.name}
onChangeText={(text) => setInputGoal({ ...inputGoal, name: text })}
        />
        <TextInput
          style={[styles.input, { color: darkMode ? 'white' : 'black' }]}
          placeholder="Days until reward"
          placeholderTextColor="#aaa"
value={inputGoal.days}
onChangeText={(text) => setInputGoal({ ...inputGoal, days: text })}
          keyboardType="numeric"
        />
                <TouchableOpacity style={styles.button} onPress={saveReward}>
        <Text style={styles.buttonText}>Save Reward</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'settings') {
    return (
      <View style={darkMode ? styles.container : styles.containerLight}>
      <View style={styles.headerContainer}>
  <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
</View>
        <Text style={[styles.header, { color: darkMode ? 'white' : 'black' }]}>Settings</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <Text style={{ color: darkMode ? 'white' : 'black', marginRight: 10 }}>Night Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
        {settingsSaved && (
  <Text style={{ color: 'green', marginBottom: 10, textAlign: 'center' }}>
    ✅ Settings Saved!
  </Text>
)}
        <TouchableOpacity style={styles.button} onPress={saveSettings}>
        <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
        <View style={{ marginTop: 10 }} />
        <TouchableOpacity style={styles.button} onPress={() => setScreen('log')}>
        <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'congrats') {
    return (
      <View style={darkMode ? styles.container : styles.containerLight}>
      <View style={styles.headerContainer}>
  <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
</View>
        <Text style={[styles.header, { color: darkMode ? 'white' : 'black' }]}>🎉 Congratulations!</Text>
        <Text style={[styles.text, { color: darkMode ? 'white' : 'black' }]}>You earned: {rewardName}!</Text>
        <Text style={[styles.text, { color: darkMode ? 'white' : 'black' }]}>Would you like to set a new reward?</Text>
        <View style={{ flexDirection: 'row', marginTop: 20 }}>
        <TouchableOpacity style={styles.button} onPress={() => handleNewRewardDecision('yes')}>
          <Text style={styles.buttonText}>Yes</Text>
          </TouchableOpacity>
          <View style={{ width: 20 }} />
          <TouchableOpacity style={styles.button} onPress={() => handleNewRewardDecision('no')}>
          <Text style={styles.buttonText}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screen === 'history') {
  const goal = getCurrentGoal();
  if (!goal) return null;

  return (
    <ScrollView style={darkMode ? styles.container : styles.containerLight} contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={styles.headerContainer}>
        <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
      </View>
      <Text style={[styles.header, { color: darkMode ? 'white' : 'black' }]}>Reward Tracker History</Text>
      {goal.history.length === 0 ? (
        <Text style={{ color: darkMode ? 'white' : 'black' }}>No history yet.</Text>
      ) : (
        goal.history.map((item, index) => (
          <View key={index} style={{ backgroundColor: item.success ? '#27632a' : '#632727', padding: 10, marginVertical: 4 }}>
            <Text style={{ color: 'white' }}>{item.date} — {item.success ? 'Success' : 'Missed'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={styles.button} onPress={() => editEntry(item)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => deleteEntry(index)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
      <View style={{ marginTop: 10 }}>
        <TouchableOpacity style={styles.button} onPress={() => setScreen('log')}>
          <Text style={styles.buttonText}>Back to Tracker</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

  if (screen === 'log') {
  const goal = getCurrentGoal();
  if (!goal) return null;

  return (
    <View style={darkMode ? styles.container : styles.containerLight}>
      <View style={styles.headerContainer}>
        <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
      </View>
      <Text style={[styles.header, { color: darkMode ? 'white' : 'black' }]}>Daily Reward Tracker</Text>
      <Text style={{ color: darkMode ? 'white' : 'black' }}>Reward: {goal.rewardName}</Text>
      <Text style={{ color: darkMode ? 'white' : 'black' }}>Days Remaining: {goal.daysRemaining}</Text>
      <Text style={{ color: '#00FF99', fontWeight: 'bold' }}>🔥 Streak: {goal.streak} days</Text>
      {message ? <Text style={{ color: darkMode ? 'white' : 'black', fontStyle: 'italic' }}>{message}</Text> : null}

      {goal.dailyGoals.map((g, index) => (
        <View style={styles.checkboxContainer} key={g.key}>
          <CheckBox
            value={g.checked}
            onValueChange={(newValue) => {
              const updatedGoals = goals.map(goalItem => {
                if (goalItem.id === selectedGoalId) {
                  const newDailyGoals = [...goalItem.dailyGoals];
                  newDailyGoals[index].checked = newValue;
                  return { ...goalItem, dailyGoals: newDailyGoals };
                }
                return goalItem;
              });
              setGoals(updatedGoals);
            }}
          />
          <Text style={{ marginLeft: 15, color: darkMode ? 'white' : 'black' }}>
            {g.name}
          </Text>
         {AdMobBanner && (
  <AdMobBanner
    bannerSize="smartBannerPortrait"
    adUnitID="ca-app-pub-3771323718627943/8480332655"
    servePersonalizedAds
    onDidFailToReceiveAdWithError={(err) => console.log(err)}
  />
)}

        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={checkDuplicateSubmission}>
        <Text style={styles.buttonText}>Submit Daily Log</Text>
      </TouchableOpacity>
      <View style={{ marginTop: 20 }} />
      <TouchableOpacity style={styles.button} onPress={() => setScreen('history')}>
        <Text style={styles.buttonText}>View History</Text>
      </TouchableOpacity>
      <View style={{ marginTop: 10 }} />
      <TouchableOpacity style={styles.button} onPress={openSettings}>
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>
      <View style={{ marginTop: 10 }} />
      <TouchableOpacity style={styles.button} onPress={() => {
        const goal = getCurrentGoal();
        setEditGoal({ ...goal }); // full goal object
        setScreen('editGoal');
      }}>
        <Text style={styles.buttonText}>Edit Goal</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => setScreen('selectGoal')}>
  <Text style={styles.buttonText}>Switch Goal</Text>
</TouchableOpacity>

    </View>
  );
}

if (screen === 'editGoal') {
  if (!editGoal) return null;

  return (
    <ScrollView style={darkMode ? styles.container : styles.containerLight}>
      <View style={styles.headerContainer}>
        <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
      </View>
      <Text style={[styles.header, { color: darkMode ? 'white' : 'black' }]}>Edit Your Goal</Text>

      <TextInput
        style={[styles.input, { color: darkMode ? 'white' : 'black' }]}
        placeholder="Reward Name"
        placeholderTextColor="#aaa"
        value={editGoal.rewardName}
        onChangeText={(text) =>
          setEditGoal({ ...editGoal, rewardName: text })
        }
      />

      <TextInput
        style={[styles.input, { color: darkMode ? 'white' : 'black' }]}
        placeholder="Days Remaining"
        placeholderTextColor="#aaa"
        value={editGoal.daysRemaining.toString()}
        onChangeText={(text) =>
          setEditGoal({ ...editGoal, daysRemaining: parseInt(text) || 0 })
        }
        keyboardType="numeric"
      />

      <Text style={[styles.header, { color: darkMode ? 'white' : 'black', fontSize: 18 }]}>
        Daily Goals:
      </Text>

      {editGoal.dailyGoals.map((goal, idx) => (
        <View key={goal.key} style={{ marginBottom: 10 }}>
          <TextInput
            style={[styles.input, { color: darkMode ? 'white' : 'black' }]}
            placeholder="Daily Goal Name"
            placeholderTextColor="#aaa"
            value={goal.name}
            onChangeText={(text) => {
              const newGoals = [...editGoal.dailyGoals];
              newGoals[idx].name = text;
              setEditGoal({ ...editGoal, dailyGoals: newGoals });
            }}
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: '#cc0000' }]} onPress={() => {
            const filtered = editGoal.dailyGoals.filter((_, index) => index !== idx);
            setEditGoal({ ...editGoal, dailyGoals: filtered });
          }}>
            <Text style={styles.buttonText}>Remove Goal</Text>
          </TouchableOpacity>
         {AdMobBanner && (
  <AdMobBanner
    bannerSize="smartBannerPortrait"
    adUnitID="ca-app-pub-3771323718627943/8480332655"
    servePersonalizedAds
    onDidFailToReceiveAdWithError={(err) => console.log(err)}
  />
)}

        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={() => {
        setEditGoal({
          ...editGoal,
          dailyGoals: [
            ...editGoal.dailyGoals,
            { key: Date.now().toString(), name: '', checked: false }
          ]
        });
      }}>
        <Text style={styles.buttonText}>Add New Goal</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 10 }} />

      <TouchableOpacity style={styles.button} onPress={async () => {
        const updatedGoals = goals.map(g =>
          g.id === selectedGoalId ? { ...editGoal } : g
        );

        setGoals(updatedGoals);
        await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
        setScreen('log');
      }}>
        <Text style={styles.buttonText}>Save Goal Changes</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 10 }} />

      <TouchableOpacity style={styles.button} onPress={() => setScreen('log')}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

if (screen === 'selectGoal') {
  return (
    <ScrollView style={darkMode ? styles.container : styles.containerLight}>
      <View style={styles.headerContainer}>
        <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
      </View>
      <Text style={[styles.header, { color: darkMode ? 'white' : 'black' }]}>Select a Goal</Text>

      {goals.length === 0 ? (
        <Text style={{ color: darkMode ? 'white' : 'black' }}>No goals yet. Create one!</Text>
      ) : (
        goals.map((g) => (
          <View key={g.id} style={{ backgroundColor: '#333', padding: 15, marginBottom: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{g.rewardName}</Text>
            <Text style={{ color: 'white' }}>Days Remaining: {g.daysRemaining}</Text>
            <Text style={{ color: 'white' }}>Streak: {g.streak} 🔥</Text>
            <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' }}>
              <TouchableOpacity style={styles.button} onPress={() => {
                setSelectedGoalId(g.id);
                setScreen('log');
              }}>
                <Text style={styles.buttonText}>Select</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#990000' }]} onPress={async () => {
                const updatedGoals = goals.filter(goal => goal.id !== g.id);
                const newSelectedId = updatedGoals.length > 0 ? updatedGoals[0].id : null;

                setGoals(updatedGoals);
                setSelectedGoalId(newSelectedId);
                await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));

                if (updatedGoals.length === 0) {
                  setScreen('setup');
                } else {
                  setScreen('selectGoal');
                }
              }}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.button} onPress={() => {
        setInputGoal({ name: '', days: '', dailyGoals: [] });
        setScreen('setup');
      }}>
        <Text style={styles.buttonText}>Add New Goal</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setScreen('log')}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


  return null;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  splashLight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
  },
  containerLight: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    marginBottom: 10
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15
  },
  headerContainer: {
  width: '100%',
  backgroundColor: 'black',
  alignItems: 'center',
  paddingVertical: 10,
  marginBottom: 20,
},
headerLogo: {
  width: 200,
  height: 100,
},
button: {
  backgroundColor: '#FF0000',  // Button background color (red)
  padding: 12,
  alignItems: 'center',
  borderRadius: 8,
  marginVertical: 5,
},

buttonText: {
  color: 'white',              // Button text color
  fontSize: 16,
  fontWeight: 'bold',
},
});


