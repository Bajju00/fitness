document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const navLinks = document.querySelectorAll('.sidebar a');
    const contentSections = document.querySelectorAll('.content-section');
    const workoutModal = document.getElementById('workout-modal');
    const goalModal = document.getElementById('goal-modal');
    const addWorkoutBtn = document.getElementById('add-workout-btn');
    const logWorkoutBtn = document.getElementById('log-workout-btn');
    const addGoalBtn = document.getElementById('add-goal-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const workoutForm = document.getElementById('workout-form');
    const goalForm = document.getElementById('goal-form');
    const todayWorkoutsList = document.getElementById('today-workouts');
    const workoutHistory = document.getElementById('workout-history');
    const activeGoalsList = document.querySelector('#active-goals .goals-list');
    const completedGoalsList = document.querySelector('#completed-goals .goals-list');
    
    // Sample data
    let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    let goals = JSON.parse(localStorage.getItem('goals')) || [];
    
    // Initialize Chart
    let weeklyChart;
    
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked link and corresponding section
            this.parentElement.classList.add('active');
            const sectionId = this.getAttribute('href').substring(1);
            document.getElementById(sectionId).classList.add('active');
            
            // If going to dashboard, update stats
            if (sectionId === 'dashboard') {
                updateDashboardStats();
                renderTodayWorkouts();
                initWeeklyChart();
            }
            
            // If going to workouts, render history
            if (sectionId === 'workouts') {
                renderWorkoutHistory();
            }
            
            // If going to goals, render goals
            if (sectionId === 'goals') {
                renderGoals();
            }
        });
    });
    
    // Modal Handling
    function openModal(modal) {
        modal.style.display = 'flex';
    }
    
    function closeModal(modal) {
        modal.style.display = 'none';
    }
    
    addWorkoutBtn.addEventListener('click', () => openModal(workoutModal));
    logWorkoutBtn.addEventListener('click', () => openModal(workoutModal));
    addGoalBtn.addEventListener('click', () => openModal(goalModal));
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
    
    // Workout Form Submission
    workoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const workout = {
            id: Date.now(),
            type: document.getElementById('workout-type').value,
            name: document.getElementById('workout-name').value,
            duration: parseInt(document.getElementById('workout-duration').value),
            calories: parseInt(document.getElementById('workout-calories').value) || 0,
            notes: document.getElementById('workout-notes').value,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        workouts.push(workout);
        saveWorkouts();
        
        // Update UI
        if (document.querySelector('.content-section.active').id === 'dashboard') {
            renderTodayWorkouts();
            updateDashboardStats();
        } else {
            renderWorkoutHistory();
        }
        
        // Reset and close form
        workoutForm.reset();
        closeModal(workoutModal);
    });
    
    // Goal Form Submission
    goalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const goal = {
            id: Date.now(),
            title: document.getElementById('goal-title').value,
            type: document.getElementById('goal-type').value,
            target: document.getElementById('goal-target').value,
            deadline: document.getElementById('goal-deadline').value,
            progress: 0,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        goals.push(goal);
        saveGoals();
        renderGoals();
        
        // Reset and close form
        goalForm.reset();
        closeModal(goalModal);
    });
    
    // Save data to localStorage
    function saveWorkouts() {
        localStorage.setItem('workouts', JSON.stringify(workouts));
    }
    
    function saveGoals() {
        localStorage.setItem('goals', JSON.stringify(goals));
    }
    
    // Render functions
    function renderTodayWorkouts() {
        const today = new Date().toISOString().split('T')[0];
        const todayWorkouts = workouts.filter(workout => workout.date === today);
        
        if (todayWorkouts.length === 0) {
            todayWorkoutsList.innerHTML = '<p class="empty-message">No workouts logged today. Add one to get started!</p>';
            return;
        }
        
        todayWorkoutsList.innerHTML = '';
        todayWorkouts.forEach(workout => {
            todayWorkoutsList.appendChild(createWorkoutElement(workout));
        });
    }
    
    function renderWorkoutHistory() {
        workoutHistory.innerHTML = '';
        
        if (workouts.length === 0) {
            workoutHistory.innerHTML = '<p class="empty-message">No workouts logged yet. Start by adding your first workout!</p>';
            return;
        }
        
        // Group workouts by date
        const groupedWorkouts = workouts.reduce((acc, workout) => {
            if (!acc[workout.date]) {
                acc[workout.date] = [];
            }
            acc[workout.date].push(workout);
            return acc;
        }, {});
        
        // Sort dates in descending order
        const sortedDates = Object.keys(groupedWorkouts).sort((a, b) => new Date(b) - new Date(a));
        
        sortedDates.forEach(date => {
            const dateHeader = document.createElement('h3');
            dateHeader.textContent = new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            workoutHistory.appendChild(dateHeader);
            
            groupedWorkouts[date].forEach(workout => {
                workoutHistory.appendChild(createWorkoutElement(workout));
            });
        });
    }
    
    function createWorkoutElement(workout) {
        const workoutEl = document.createElement('div');
        workoutEl.className = 'workout-item';
        
        const typeIcon = workout.type === 'cardio' ? 'fa-heartbeat' : 
                        workout.type === 'strength' ? 'fa-dumbbell' : 'fa-spa';
        
        workoutEl.innerHTML = `
            <div class="workout-info">
                <h3><i class="fas ${typeIcon}"></i> ${workout.name}</h3>
                <p>${workout.notes || 'No notes'}</p>
                <small>${workout.time}</small>
            </div>
            <div class="workout-stats">
                <p class="duration">${workout.duration} min</p>
                <p class="calories">${workout.calories} cal</p>
            </div>
        `;
        
        return workoutEl;
    }
    
    function renderGoals() {
        activeGoalsList.innerHTML = '';
        completedGoalsList.innerHTML = '';
        
        if (goals.length === 0) {
            activeGoalsList.innerHTML = '<p class="empty-message">No goals set yet. Add your first goal to get started!</p>';
            return;
        }
        
        goals.forEach(goal => {
            const goalEl = document.createElement('div');
            goalEl.className = `goal-item ${goal.completed ? 'completed' : ''}`;
            
            const deadlineDate = new Date(goal.deadline);
            const today = new Date();
            const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
            
            goalEl.innerHTML = `
                <div>
                    <div class="goal-title">${goal.title}</div>
                    <div class="goal-deadline">Target: ${goal.target} • ${daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}</div>
                    <div class="goal-progress">
                        <div class="goal-progress-bar" style="width: ${goal.progress}%"></div>
                    </div>
                </div>
                <div>
                    <button class="complete-btn" data-id="${goal.id}">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            `;
            
            if (goal.completed) {
                completedGoalsList.appendChild(goalEl);
            } else {
                activeGoalsList.appendChild(goalEl);
            }
        });
        
        // Add event listeners to complete buttons
        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const goalId = parseInt(this.getAttribute('data-id'));
                const goalIndex = goals.findIndex(g => g.id === goalId);
                
                if (goalIndex !== -1) {
                    goals[goalIndex].completed = true;
                    goals[goalIndex].progress = 100;
                    saveGoals();
                    renderGoals();
                }
            });
        });
    }
    
    // Dashboard stats
    function updateDashboardStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayWorkouts = workouts.filter(workout => workout.date === today);
        
        // Calculate total calories burned today
        const totalCalories = todayWorkouts.reduce((sum, workout) => sum + workout.calories, 0);
        document.getElementById('calories-burned').textContent = totalCalories;
        
        // Calculate total workout time today
        const totalDuration = todayWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
        document.getElementById('workout-time').textContent = `${totalDuration} min`;
        
        // Calculate steps (simulated)
        const steps = Math.floor(Math.random() * 5000) + 3000;
        document.getElementById('steps-today').textContent = steps.toLocaleString();
        
        // Calculate streak (simulated)
        const streak = workouts.length > 0 ? Math.floor(Math.random() * 10) + 1 : 0;
        document.getElementById('current-streak').textContent = `${streak} days`;
    }
    
    // Weekly chart
    function initWeeklyChart() {
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        
        // Get last 7 days data
        const dates = [];
        const caloriesData = [];
        const durationData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            const dayWorkouts = workouts.filter(w => w.date === dateStr);
            caloriesData.push(dayWorkouts.reduce((sum, w) => sum + w.calories, 0));
            durationData.push(dayWorkouts.reduce((sum, w) => sum + w.duration, 0));
        }
        
        if (weeklyChart) {
            weeklyChart.destroy();
        }
        
        weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Calories Burned',
                        data: caloriesData,
                        backgroundColor: '#ff6b6b',
                        borderColor: '#ff6b6b',
                        borderWidth: 1
                    },
                    {
                        label: 'Workout Minutes',
                        data: durationData,
                        backgroundColor: '#48dbfb',
                        borderColor: '#48dbfb',
                        borderWidth: 1,
                        type: 'line',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Weekly Activity Summary'
                    }
                }
            }
        });
    }
    
    // Initialize the app
    function init() {
        updateDashboardStats();
        renderTodayWorkouts();
        renderWorkoutHistory();
        renderGoals();
        initWeeklyChart();
    }
    
    init();
});