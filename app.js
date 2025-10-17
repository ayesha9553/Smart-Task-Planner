document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const goalForm = document.getElementById('goalForm');
    const goalInput = document.getElementById('goalInput');
    const loader = document.getElementById('loader');
    const results = document.getElementById('results');
    const goalDisplay = document.getElementById('goalDisplay');
    const taskList = document.getElementById('taskList');
    const timeline = document.getElementById('timeline');
    const saveButton = document.getElementById('saveButton');
    const exportButton = document.getElementById('exportButton');
    const savedPlansSection = document.getElementById('savedPlans');
    const plansList = document.getElementById('plansList');
    
    // Global variables to store current plan
    let currentGoal = '';
    let currentTaskPlan = null;
    
    // Add subtle parallax effect to header
    document.addEventListener('mousemove', (e) => {
        const header = document.querySelector('header');
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        
        header.style.backgroundPosition = `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`;
    });
    
    // Animate goal input on focus
    goalInput.addEventListener('focus', () => {
        const goalInputSection = document.querySelector('.goal-input');
        goalInputSection.style.transform = 'translateY(-8px)';
        goalInputSection.style.boxShadow = 'var(--shadow-medium)';
    });
    
    goalInput.addEventListener('blur', () => {
        const goalInputSection = document.querySelector('.goal-input');
        goalInputSection.style.transform = '';
        goalInputSection.style.boxShadow = '';
    });
    
    // Button hover effects
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.style.transform = 'translateX(3px) scale(1.2)';
            }
        });
        
        btn.addEventListener('mouseleave', () => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.style.transform = '';
            }
        });
    });
    
    // Event Listeners
    goalForm.addEventListener('submit', handleGoalSubmit);
    saveButton.addEventListener('click', savePlan);
    exportButton.addEventListener('click', exportPlanAsPDF);
    
    // Check for saved plans in localStorage on load
    loadSavedPlans();
    
    // Add typewriter effect to header text
    const headerText = document.querySelector('header p');
    const text = headerText.textContent;
    headerText.textContent = '';
    headerText.style.opacity = '1';
    
    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            headerText.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 30);
        }
    };
    
    // Start typewriter effect after a short delay
    setTimeout(typeWriter, 1500);
    
    // Handle goal form submission
    async function handleGoalSubmit(e) {
        e.preventDefault();
        
        const goal = goalInput.value.trim();
        
        if (!goal) {
            // Enhanced error notification
            showNotification('Please enter a goal', 'error');
            animateShake(goalInput);
            return;
        }
        
        currentGoal = goal;
        
        // Add button loading state
        const submitBtn = goalForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        // Animate form section
        const goalInputSection = document.querySelector('.goal-input');
        goalInputSection.style.opacity = '0.7';
        goalInputSection.style.transform = 'scale(0.98)';
        
        // Show loader with enhanced animation
        loader.style.display = 'flex';
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.opacity = '1';
        }, 50);
        
        results.style.display = 'none';
        
        // Add dynamic loading messages
        const loadingMessages = [
            "Breaking down your goal...",
            "Planning your tasks...",
            "Analyzing dependencies...",
            "Creating timeline...",
            "Finalizing your plan..."
        ];
        
        const loaderMsg = loader.querySelector('p');
        let msgIndex = 0;
        
        const messageInterval = setInterval(() => {
            loaderMsg.style.opacity = '0';
            setTimeout(() => {
                loaderMsg.textContent = loadingMessages[msgIndex % loadingMessages.length];
                loaderMsg.style.opacity = '1';
                msgIndex++;
            }, 300);
        }, 2000);
        
        try {
            // Call backend API
            const response = await fetch('/api/generate-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ goal }),
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Store task plan
            currentTaskPlan = data.taskPlan;
            
            // Add small delay for better UX
            setTimeout(() => {
                // Display results
                displayResults(goal, data.taskPlan);
                
                // Success notification
                showNotification('Task plan generated successfully!', 'success');
            }, 800);
            
        } catch (error) {
            console.error('Error generating task plan:', error);
            showNotification('Failed to generate task plan. Please try again.', 'error');
            animateShake(goalForm);
        } finally {
            // Clear message interval
            clearInterval(messageInterval);
            
            // Hide loader with fade out
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                loader.style.opacity = '1';
            }, 300);
            
            // Reset button
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                // Reset form animation
                goalInputSection.style.opacity = '';
                goalInputSection.style.transform = '';
            }, 500);
        }
    }
    
    // Helper function to show notifications
    function showNotification(message, type) {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
            
            // Add styles
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.padding = '12px 20px';
            notification.style.borderRadius = '8px';
            notification.style.boxShadow = 'var(--shadow-medium)';
            notification.style.fontWeight = '500';
            notification.style.zIndex = '1000';
            notification.style.transform = 'translateY(100px)';
            notification.style.opacity = '0';
            notification.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        }
        
        // Set type-specific styles
        if (type === 'success') {
            notification.style.backgroundColor = 'var(--success-color)';
            notification.style.color = 'white';
        } else if (type === 'error') {
            notification.style.backgroundColor = 'var(--danger-color)';
            notification.style.color = 'white';
        }
        
        // Set message and show
        notification.textContent = message;
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
        
        // Hide after delay
        setTimeout(() => {
            notification.style.transform = 'translateY(100px)';
            notification.style.opacity = '0';
        }, 3000);
    }
    
    // Helper function to animate element shake
    function animateShake(element) {
        element.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
        
        // Add keyframes if they don't exist
        if (!document.querySelector('#shake-keyframes')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'shake-keyframes';
            styleSheet.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Remove animation after it completes
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
    
    // Display generated task plan
    function displayResults(goal, taskPlan) {
        // Display goal
        goalDisplay.textContent = goal;
        
        // Clear previous tasks
        taskList.innerHTML = '';
        timeline.innerHTML = '';
        
        // Sort tasks by dependency order and then by deadline
        const sortedTasks = [...taskPlan.tasks].sort((a, b) => {
            // First sort by dependencies
            if (a.dependencies.includes(b.id)) return 1;
            if (b.dependencies.includes(a.id)) return -1;
            
            // Then sort by deadline
            const dateA = new Date(a.deadline);
            const dateB = new Date(b.deadline);
            return dateA - dateB;
        });
        
        // Set up results section with animation
        results.style.display = 'block';
        results.classList.remove('show');
        
        // Trigger reflow to restart animation
        void results.offsetWidth;
        
        // Add animation class after a short delay to ensure CSS transition works
        setTimeout(() => {
            results.classList.add('show');
        }, 10);
        
        // Display tasks with staggered animation
        sortedTasks.forEach((task, index) => {
            // Create task card with animation delay
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.style.animationDelay = `${index * 0.1}s`;
            taskCard.innerHTML = `
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-deadline"><i class="far fa-calendar-alt"></i> ${formatDate(task.deadline)}</div>
                </div>
                <div class="task-description">${task.description}</div>
                <div class="task-meta">
                    <div class="task-duration"><strong>Est. Duration:</strong> ${task.estimatedDuration}</div>
                </div>
                ${task.dependencies.length > 0 ? `
                <div class="task-dependencies">
                    <strong>Dependencies:</strong> ${task.dependencies.map(dep => {
                        const depTask = taskPlan.tasks.find(t => t.id === dep);
                        return depTask ? `<span>${depTask.title}</span>` : '';
                    }).join('')}
                </div>
                ` : ''}
                <div class="task-status status-not-started">Not Started</div>
            `;
            
            // Add interaction effects
            taskCard.addEventListener('mouseenter', () => {
                const title = taskCard.querySelector('.task-title');
                if (title) {
                    title.style.color = 'var(--primary-color)';
                    title.style.transform = 'scale(1.02)';
                    title.style.transition = 'all 0.3s ease';
                }
            });
            
            taskCard.addEventListener('mouseleave', () => {
                const title = taskCard.querySelector('.task-title');
                if (title) {
                    title.style.color = '';
                    title.style.transform = '';
                }
            });
            
            // Add to task list
            taskList.appendChild(taskCard);
            
            // Add to timeline with animation
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.style.setProperty('--i', index.toString());
            timelineItem.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-date">${formatDate(task.deadline)}</div>
                <div class="timeline-content">
                    <div class="timeline-title"><strong>${task.title}</strong></div>
                    <div class="timeline-desc">${task.description}</div>
                </div>
            `;
            
            timeline.appendChild(timelineItem);
        });
        
        // Add confetti effect when results are displayed
        createConfetti();
        
        // Initialize progress bar
        initProgressBar();
        
        // Setup task interactions
        setTimeout(setupTaskInteractions, 1000);
        
        // Scroll to results with smooth animation
        results.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
    
    // Confetti animation effect
    function createConfetti() {
        const confettiColors = ['#4285f4', '#34a853', '#fbbc05', '#ea4335'];
        const confettiContainer = document.createElement('div');
        confettiContainer.style.position = 'absolute';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '-1';
        results.style.position = 'relative';
        results.style.overflow = 'hidden';
        results.appendChild(confettiContainer);
        
        // Create confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            const size = Math.random() * 10 + 5;
            
            confetti.style.position = 'absolute';
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.top = '-20px';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.opacity = '0';
            confetti.style.transform = 'translateY(0)';
            confetti.style.animation = `
                fadeInUp ${Math.random() * 1 + 1}s ease-out forwards,
                fall ${Math.random() * 3 + 2}s ease-in ${Math.random() * 0.5}s forwards
            `;
            
            // Add keyframes if they don't exist
            if (!document.querySelector('#confetti-keyframes')) {
                const styleSheet = document.createElement('style');
                styleSheet.id = 'confetti-keyframes';
                styleSheet.textContent = `
                    @keyframes fall {
                        to {
                            transform: translateY(${results.offsetHeight + 100}px) rotate(${Math.random() * 360}deg);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(styleSheet);
            }
            
            confettiContainer.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
        
        // Remove container after all animations
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }
    
    // Initialize progress bar
    function initProgressBar() {
        // Set initial progress based on completed tasks
        if (currentTaskPlan) {
            const totalTasks = currentTaskPlan.tasks.length;
            const completedTasks = currentTaskPlan.tasks.filter(task => task.status === 'Completed').length;
            const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            const progressBar = document.querySelector('.progress');
            const progressText = document.querySelector('.progress-text');
            
            // Animate progress bar
            setTimeout(() => {
                progressBar.style.width = `${percentage}%`;
                progressText.textContent = `${percentage}% Complete`;
            }, 500);
        }
    }
    
    // Save plan to localStorage with enhanced animation
    function savePlan() {
        if (!currentTaskPlan) {
            showNotification('No plan to save', 'error');
            return;
        }
        
        // Add button loading animation
        const saveButton = document.getElementById('saveButton');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;
        
        // Simulate saving delay for better UX
        setTimeout(() => {
            // Get existing plans or initialize empty array
            const savedPlans = JSON.parse(localStorage.getItem('taskPlans') || '[]');
            
            // Create new plan object
            const newPlan = {
                id: Date.now().toString(),
                goal: currentGoal,
                tasks: currentTaskPlan.tasks,
                createdAt: new Date().toISOString()
            };
            
            // Add new plan to the beginning of the array
            savedPlans.unshift(newPlan);
            
            // Save updated plans
            localStorage.setItem('taskPlans', JSON.stringify(savedPlans));
            
            // Update saved plans display
            loadSavedPlans();
            
            // Success animation
            saveButton.innerHTML = '<i class="fas fa-check"></i> Saved!';
            saveButton.style.backgroundColor = 'var(--success-color)';
            
            // Show success notification
            showNotification('Plan saved successfully!', 'success');
            
            // Reset button after delay
            setTimeout(() => {
                saveButton.innerHTML = originalText;
                saveButton.disabled = false;
                saveButton.style.backgroundColor = '';
            }, 2000);
            
        }, 800);
    }
    
    // Add task status toggling functionality
    function setupTaskInteractions() {
        // Add click event for task status toggle
        document.querySelectorAll('.task-card').forEach(card => {
            const statusEl = card.querySelector('.task-status');
            if (statusEl) {
                statusEl.addEventListener('click', function() {
                    // Rotate through statuses
                    if (this.classList.contains('status-not-started')) {
                        this.classList.remove('status-not-started');
                        this.classList.add('status-in-progress');
                        this.textContent = 'In Progress';
                    } else if (this.classList.contains('status-in-progress')) {
                        this.classList.remove('status-in-progress');
                        this.classList.add('status-completed');
                        this.textContent = 'Completed';
                    } else {
                        this.classList.remove('status-completed');
                        this.classList.add('status-not-started');
                        this.textContent = 'Not Started';
                    }
                    
                    // Update task in currentTaskPlan
                    if (currentTaskPlan) {
                        const taskTitle = card.querySelector('.task-title').textContent;
                        const task = currentTaskPlan.tasks.find(t => t.title === taskTitle);
                        if (task) {
                            if (this.classList.contains('status-not-started')) {
                                task.status = 'Not Started';
                            } else if (this.classList.contains('status-in-progress')) {
                                task.status = 'In Progress';
                            } else {
                                task.status = 'Completed';
                            }
                        }
                    }
                    
                    // Update progress bar
                    initProgressBar();
                });
            }
        });
    }
    
    // Load saved plans from localStorage
    function loadSavedPlans() {
        const savedPlans = JSON.parse(localStorage.getItem('taskPlans') || '[]');
        
        if (savedPlans.length === 0) {
            savedPlansSection.style.display = 'none';
            return;
        }
        
        // Clear previous plans
        plansList.innerHTML = '';
        
        // Display each saved plan
        savedPlans.forEach(plan => {
            const planCard = document.createElement('div');
            planCard.className = 'plan-card';
            
            // Count tasks and completion
            const totalTasks = plan.tasks.length;
            const completedTasks = plan.tasks.filter(task => task.status === 'Completed').length;
            
            planCard.innerHTML = `
                <div class="plan-goal">${plan.goal}</div>
                <div class="plan-date">Created: ${formatDate(plan.createdAt)}</div>
                <div class="plan-summary">
                    <span>${totalTasks} tasks</span>
                    <span>${completedTasks}/${totalTasks} completed</span>
                </div>
                <button class="plan-view-btn" data-plan-id="${plan.id}">View Plan</button>
            `;
            
            // Add event listener to view button
            planCard.querySelector('.plan-view-btn').addEventListener('click', () => {
                displayResults(plan.goal, { tasks: plan.tasks });
                currentGoal = plan.goal;
                currentTaskPlan = { tasks: plan.tasks };
                
                // Scroll to results
                results.scrollIntoView({ behavior: 'smooth' });
            });
            
            plansList.appendChild(planCard);
        });
        
        // Show saved plans section
        savedPlansSection.style.display = 'block';
    }
    
    // Export plan as PDF (simplified version)
    function exportPlanAsPDF() {
        if (!currentTaskPlan) {
            alert('No plan to export');
            return;
        }
        
        alert('PDF export functionality would be implemented here.');
        // In a real application, you would use a library like jsPDF or html2pdf
        // to generate a PDF file with the task plan
    }
    
    // Helper function to format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
});