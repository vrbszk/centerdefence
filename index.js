const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

//var ratio = window.devicePixelRatio || 1;
var ratio = 1
var width = window.innerWidth * ratio;
var height = window.innerHeight * ratio;

canvas.width = width
canvas.height = height

const scoreEl = document.querySelector('#scoreEl')
const startGameBtn = document.querySelector('#startGameBtn')
const modalEl = document.querySelector('#modalEl')
const bigScoreEl = document.querySelector('#bigScoreEl')

class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const friction = 0.99
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1
    }

    draw() {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01
        
    }
}

const x = canvas.width / 2
const y = canvas.height / 2

let player = new Player(x, y, 10, 'white')
let projectiles = []
let enemies = []
let particles = []

function init() {
    player = new Player(x, y, 10, 'white')
    projectiles = []
    enemies = []
    particles = []
    score = 0
    scoreEl.innerHTML = 0
    bigScoreEl.innerHTML = 0
    spawnActive = true
}

let spawnID
function spawnEnemies() {
    spawnID = setInterval(() => {
        const radius = Math.random() * (30 - 4) + 4

        let x 
        let y
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
            y = Math.random() * canvas.height
        } else {
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
        }
        
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`
        
        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
    
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 1000)
}

let animationId
let score = 0
function animate() {
    animationId = requestAnimationFrame(animate)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    player.draw()
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        } else {
            particle.update()
        }
    })
    projectiles.forEach((projectile, index) => {
        projectile.update()

        // remove from edges of screen
        if (projectile.x + projectile.radius < 0 || projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 || projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0);
        }
    })

    enemies.forEach((enemy, index) => {
        enemy.update()

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)

        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId)
            clearInterval(spawnID)
            modalEl.style.display = 'flex'
            bigScoreEl.innerHTML = score
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
            
            if (dist - enemy.radius - projectile.radius < 1) {
                

                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, 
                    {x: (Math.random() - 0.5) * (Math.random() * 6), y: (Math.random() - 0.5) * (Math.random() * 6)}))
                }

                if (enemy.radius - 10 > 5) {
                    score += 100
                    scoreEl.innerHTML = score
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    projectiles.splice(projectileIndex, 1)
                } else {
                    score += 250
                    scoreEl.innerHTML = score
                    setTimeout(() => {
                        enemies.splice(index, 1)
                        projectiles.splice(projectileIndex, 1)
                    }, 0);
                }
            }
        })
    })
}

function shoot(x, y) {
    const angle = Math.atan2(y - canvas.height / 2, x - canvas.width / 2)
    
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }

    projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity))
}

window.addEventListener('click', (event) => {
    
    shoot(event.x, event.y)
})

window.addEventListener('dblclick', (event) => {
    shoot(event.x, event.y)
    shoot(event.x, event.y)
    console.log(event.x, event.y)
})

startGameBtn.addEventListener('click', () => {
    init()
    animate()
    spawnEnemies()
    modalEl.style.display = 'none'
})