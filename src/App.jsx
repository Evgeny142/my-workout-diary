import { useState, useEffect, useRef } from 'react'
import './App.css'

const PROGRAM = {
  Push: [
    { name: 'Жим штанги лёжа', target: '4 × 6–10', rest: '2,5–3 мин', restMax: 180 },
    { name: 'Жим гантелей на наклонной', target: '3 × 8–12', rest: '2 мин', restMax: 120 },
    { name: 'Жим гантелей сидя (плечи)', target: '3 × 8–12', rest: '90–120 сек', restMax: 120 },
    { name: 'Махи гантелями в стороны', target: '3 × 12–15', rest: '60–90 сек', restMax: 90 },
    { name: 'Разгибание рук на блоке', target: '3 × 10–15', rest: '60 сек', restMax: 60 }
  ],
  Pull: [
    { name: 'Подтягивания / Тяга верхнего блока', target: '4 × 8–12', rest: '2–2,5 мин', restMax: 150 },
    { name: 'Тяга штанги в наклоне', target: '3 × 8–12', rest: '2–2,5 мин', restMax: 150 },
    { name: 'Тяга горизонтального блока', target: '3 × 10–12', rest: '90–120 сек', restMax: 120 },
    { name: 'Тяга гантели в наклоне одной рукой', target: '3 × 10–12', rest: '90 сек', restMax: 90 },
    { name: 'Face pull', target: '3 × 12–15', rest: '60 сек', restMax: 60 },
    { name: 'Подъём штанги / гантелей на бицепс', target: '3 × 10–12', rest: '60–90 сек', restMax: 90 }
  ],
  Legs: [
    { name: 'Приседания со штангой', target: '4 × 6–10', rest: '2,5–3 мин', restMax: 180 },
    { name: 'Румынская тяга', target: '3 × 8–10', rest: '2–2,5 мин', restMax: 150 },
    { name: 'Жим ногами', target: '3 × 10–15', rest: '90–120 сек', restMax: 120 },
    { name: 'Сгибание ног лёжа', target: '3 × 10–15', rest: '60–90 сек', restMax: 90 },
    { name: 'Подъём на носки', target: '3 × 12–15', rest: '45–60 сек', restMax: 60 }
  ]
}

function ExercisePage({ exercise, dayName, workouts, setWorkouts, onNext, onPrev, showPrev, isLast, activeSession, onFinish }) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [showAllSets, setShowAllSets] = useState(false)
  
  // Логика таймера, привязанная к реальному времени
  const [timeLeft, setTimeLeft] = useState(exercise.restMax)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [endTime, setEndTime] = useState(null)

  const today = new Date().toLocaleDateString('ru-RU')

  const exerciseWorkouts = workouts.filter(
    w => w.day === dayName && w.exercise === exercise.name
  )

  const previousSessions = exerciseWorkouts.filter(w => w.session !== activeSession)
  const lastResult = previousSessions.length > 0 ? previousSessions[0] : null

  const targetSetsStr = exercise.target.split(' × ')[0];
  const targetSets = parseInt(targetSetsStr) || 1;
  const completedSetsToday = exerciseWorkouts.filter(w => w.session === activeSession).length;
  const isCompleted = completedSetsToday >= targetSets;

  // Сброс полей при смене упражнения
  useEffect(() => {
    const currentExWorkouts = workouts.filter(
      w => w.day === dayName && w.exercise === exercise.name
    );

    if (currentExWorkouts.length > 0) {
      setWeight(currentExWorkouts[0].weight);
      setReps(currentExWorkouts[0].reps);
    } else {
      setWeight('');
      setReps('');
    }
    
    // Сбрасываем таймер
    setTimeLeft(exercise.restMax);
    setIsTimerRunning(false);
    setEndTime(null);
    setShowAllSets(false);
  }, [exercise, dayName]);

  // Исправленный эффект таймера
  useEffect(() => {
    let interval = null;
    
    if (isTimerRunning && endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          setIsTimerRunning(false);
          setEndTime(null);
          // Вибрация при окончании таймера (если поддерживается)
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
      }, 250); // Проверяем 4 раза в секунду для точности
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, endTime]);

  const startTimer = () => {
    const newEndTime = Date.now() + exercise.restMax * 1000;
    setEndTime(newEndTime);
    setTimeLeft(exercise.restMax);
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setEndTime(null);
    setTimeLeft(exercise.restMax);
  };

  const handleAddSet = (e) => {
    e.preventDefault()
    if (!weight || !reps) return

    const newSet = {
      id: Date.now(),
      day: dayName,
      exercise: exercise.name,
      weight: weight,
      reps: reps,
      date: today,
      session: activeSession
    }

    setWorkouts([newSet, ...workouts])
    startTimer(); // Автоматический запуск при добавлении подхода
  }

  const deleteSet = (id) => {
    setWorkouts(workouts.filter(w => w.id !== id))
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const adjustWeight = (amount) => {
    const currentWeight = parseFloat(weight) || 0
    const newWeight = Math.max(0, currentWeight + amount)
    setWeight(newWeight % 1 === 0 ? newWeight.toString() : newWeight.toFixed(2))
  }

  const currentSessionSets = exerciseWorkouts.filter(w => w.session === activeSession)
  const displayedSets = showAllSets ? currentSessionSets : currentSessionSets.slice(0, 9)

  let btnText = 'Следующее →';
  if (!isCompleted) {
    btnText = `Выполнено ${completedSetsToday} из ${targetSets}`;
  } else if (isLast) {
    btnText = 'Конец тренировки';
  }

  return (
    <div className="exercise-page">
      <div className="exercise-header-main">
        <h2>{exercise.name}</h2>
        <div className="exercise-meta-main">
          <span>Подходы: {exercise.target}</span>
          <span>Отдых: {exercise.rest}</span>
        </div>
      </div>

      {lastResult && (
        <div className="last-result-banner">
          <span>Прошлый раз ({lastResult.date}):</span>
          <strong>{lastResult.weight} кг × {lastResult.reps}</strong>
        </div>
      )}

      <div className={`timer-container ${isTimerRunning ? 'active-timer' : ''}`}>
        <div className="timer-display">{formatTime(timeLeft)}</div>
        <button 
          className={`timer-btn ${isTimerRunning ? 'stop' : 'start'}`} 
          onClick={isTimerRunning ? stopTimer : startTimer}
        >
          {isTimerRunning ? 'Стоп' : 'Отдых'}
        </button>
      </div>

      <form className="main-form" onSubmit={handleAddSet}>
        <div className="form-row">
          <label className="form-label">Вес (кг)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="Введите вес"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="form-input"
          />
          <div className="quick-buttons-row">
            <button type="button" className="quick-btn" onClick={() => adjustWeight(-2.5)}>-2.5</button>
            <button type="button" className="quick-btn" onClick={() => adjustWeight(2.5)}>+2.5</button>
          </div>
        </div>
        
        <div className="form-row">
          <label className="form-label">Повторения</label>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            placeholder="Введите повторения"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="form-input"
          />
        </div>
        
        <button type="submit" className="icon-btn add">Добавить подход</button>
      </form>

      <div className="nav-buttons-top">
        <button 
          className="next-btn" 
          onClick={isLast ? onFinish : onNext}
          disabled={!isCompleted}
        >
          {btnText}
        </button>
        {showPrev && (
          <button className="prev-btn-text" onClick={onPrev}>
            ← Предыдущее упражнение
          </button>
        )}
      </div>

      <div className={`progress-status ${isCompleted ? 'completed' : ''}`}>
        Выполнено {completedSetsToday} из {targetSets} подходов
      </div>

      <div className="history-section">
        <h3>Текущая тренировка:</h3>
        {currentSessionSets.length === 0 ? (
          <p className="empty-text">Нет записей</p>
        ) : (
          <>
            <div className="logged-sets">
              {displayedSets.map((set) => (
                <div key={set.id} className="set-item">
                  <span className="set-date">{set.date}</span>
                  <span className="set-data">{set.weight} кг × {set.reps}</span>
                  <button className="icon-btn delete" onClick={() => deleteSet(set.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            {currentSessionSets.length > 9 && (
              <button 
                className="show-more-btn" 
                onClick={() => setShowAllSets(!showAllSets)}
              >
                {showAllSets ? 'Скрыть' : `Показать все (${currentSessionSets.length})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function App() {
  const [activeDay, setActiveDay] = useState('Push')
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const fileInputRef = useRef(null)
  
  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem('my-ppl-workouts')
    return saved ? JSON.parse(saved) : []
  })

  const [activeSession, setActiveSession] = useState(() => {
    const savedSession = localStorage.getItem('ppl-session')
    return savedSession ? Number(savedSession) : Date.now()
  })

  useEffect(() => {
    localStorage.setItem('my-ppl-workouts', JSON.stringify(workouts))
    localStorage.setItem('ppl-session', activeSession.toString())
  }, [workouts, activeSession])

  const handleDayChange = (day) => {
    setActiveDay(day)
    setCurrentExerciseIndex(0)
  }

  const handleFinishWorkout = () => {
    if (window.confirm('Тренировка завершена! Начать новый цикл (Push) с чистыми счетчиками?')) {
      setActiveSession(Date.now())
      setActiveDay('Push')
      setCurrentExerciseIndex(0)
      window.scrollTo(0, 0)
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(workouts, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ppl-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result)
        if (Array.isArray(imported)) {
          setWorkouts(imported)
          alert("Данные успешно загружены!")
        } else {
          alert("Неверный формат файла.")
        }
      } catch (err) {
        alert("Ошибка при чтении файла.")
      }
    }
    reader.readAsText(file)
    e.target.value = null 
  }

  const currentExercise = PROGRAM[activeDay][currentExerciseIndex]
  const isLastExercise = currentExerciseIndex === PROGRAM[activeDay].length - 1

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>PPL Дневник</h1>
        <div className="day-tabs">
          {['Push', 'Pull', 'Legs'].map(day => (
            <button
              key={day}
              className={`tab-btn ${activeDay === day ? 'active' : ''}`}
              onClick={() => handleDayChange(day)}
            >
              {day}
            </button>
          ))}
        </div>
      </header>

      <main className="app-content">
        <div className="layout-container">
          
          <nav className="exercise-sidebar">
            <h3>Упражнения</h3>
            {PROGRAM[activeDay].map((ex, index) => (
              <button
                key={index}
                className={`sidebar-item ${currentExerciseIndex === index ? 'active' : ''}`}
                onClick={() => setCurrentExerciseIndex(index)}
              >
                {ex.name}
              </button>
            ))}
          </nav>

          <div className="exercise-main">
            <ExercisePage 
              exercise={currentExercise}
              dayName={activeDay}
              workouts={workouts}
              setWorkouts={setWorkouts}
              isLast={isLastExercise}
              showPrev={currentExerciseIndex > 0}
              onNext={() => setCurrentExerciseIndex(prev => prev + 1)}
              onPrev={() => setCurrentExerciseIndex(prev => prev - 1)}
              activeSession={activeSession}
              onFinish={handleFinishWorkout}
            />

            <div className="backup-section">
              <p>Резервная копия данных:</p>
              <div className="backup-buttons">
                <button className="backup-btn" onClick={exportData}>Скачать (JSON)</button>
                <button className="backup-btn" onClick={() => fileInputRef.current.click()}>Загрузить</button>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={importData} 
                />
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}

export default App