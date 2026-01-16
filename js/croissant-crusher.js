/**
*   @author Anthony Wasilkoff
*   @version 1.0
*/

//physics constants
const crushSpeed = 1;
const croissantSpeed = 25;
const magnetStrength = 0.025;
const gravity = 1;
const croissantBounciness = 0.45;
const croissantFriction = 0.1;
const leverTravel = 70;

//physics variables
//fallback values for game bounds
var boundsN = 0;
var boundsS = 372;
var boundsW = 0;
var boundsE = 372;

//state variables
var pressActive = false;
var hitBottom = false;
var mouseX = 0;
var mouseY = 0;
var money = 0;

//HTML
var moneyLabel;
var gameArea;

//game objects
var gameWindow;
var crushBounds;
var croissants;
var createCroissantButton;
var leverHead;
var leverShaft;
var leverDown = false;
var leverCooldown = false;
var chute;
var particles;
var pressHead;
var pressShaft;
var pressShaftCover;
var gameAreaOffset;

/**
 * Initialize the html and game objects at page load
 */
window.addEventListener("load", function(){
    gameArea = document.querySelector("#game-area");
    gameWindow = gameArea.getBoundingClientRect();
    
    //initialize crush area
    crushBounds = document.querySelector("#crush-area").getBoundingClientRect();
    
    //initialize the croissant button & chute
    createCroissantButton = document.querySelector("#buy-croissant");
    chute = document.querySelector("#chute");
    
    //initialize existing croissants
    particles = document.querySelectorAll(".particle");
    croissants = document.querySelectorAll(".croissant");
    console.log(croissants);
    document.addEventListener("mouseup",function(){spriteMouseUp()}); 
    croissants.forEach(element => {
        element.addEventListener("mousedown",function(){spriteMouseDown(this)});
    });
    
    //initialize the lever
    leverHead = document.querySelector("#lever-head");
    leverHead.addEventListener("mousedown",function(){spriteMouseDown(this)});
    leverShaft = document.querySelector("#lever-shaft");
    leverShaft.setAttribute("x", leverHead.getAttribute("x"));
    leverShaft.setAttribute("y", leverHead.getAttribute("y"));
    leverShaft.setAttribute("height", leverTravel/2);

    //set game bounds based on gameWindow position
    boundsN = gameWindow.top - gameWindow.y;
    boundsE = gameWindow.right - (128 + gameWindow.x);
    boundsS = gameWindow.bottom - (128 + gameWindow.y);
    boundsW = gameWindow.left - gameWindow.x;

    //initialize the hydraulic press
    pressHead = document.querySelector("#press-head");
    pressShaft = document.querySelector("#press-shaft");
    pressShaftCover = document.querySelector("#press-shaft-cover");
    
    //find the money counter
    moneyLabel = document.querySelector("#money");

    //find the offset group for css driven screenshake animation    
    gameAreaOffset = document.querySelector("#game-offset");

    //set game update tick for 60fps
    setInterval(update, 1000/60);
});
/**
 * update function for the game 
 */
function update(){
    computeCroissantVelocity();
    computeLeverVelocity();
    if(particles.length > 0){
        computeParticles();
    }
    if(pressActive == true){
        animatePress();
    }
}

/**
 * event for clicking an interactable sprite
 * @param {*} sprite any physics affected svg element
 */
function spriteMouseDown(sprite){
    sprite.setAttribute("follow","true");
}

/**
 * sets all objects to unfollow on mouseup
 */
function spriteMouseUp(){
    croissants.forEach(element => {
        element.setAttribute("follow","false");
    });
    leverHead.setAttribute("follow","false");
}

/**
 * tracks the mouse position
 * @param {*} event 
 */
function mouseMove(event){
    mouseX = event.pageX - gameWindow.x;
    mouseY = event.pageY - gameWindow.y;
}

/**
 * @param {*} element
 * @returns {float} center pixel position of an svg element on the x axis
 */
function getCenterX(element){
    return parseFloat(element.getAttribute("x")) + (parseFloat(element.getAttribute("width"))/2);
}

/**
 * @param {*} element
 * @returns {float} center pixel position of an svg element on the y axis
 */
function getCenterY(element){
    return parseFloat(element.getAttribute("y")) + (parseFloat(element.getAttribute("height"))/2);
}
function deltaX(element){
    return getCenterX(element) - mouseX;
}
function deltaY(element){
    return getCenterY(element) - mouseY;
}
function getTheta(element){
    return Math.atan(deltaY(element)/deltaX(element));
}
function moveToMouse(element){
    var theta = getTheta(element);
    var targetX = Math.cos(theta);
    var targetY = 1-targetX;
    if(deltaX(element) > 0){
        targetX*=-1;
    }
    if(deltaY(element) > 0){
        targetY*=-1
    }
    var velocityX = parseFloat(element.getAttribute("vx"));
    var velocityY = parseFloat(element.getAttribute("vy"));
    element.setAttribute("vx", "" + interpolate(targetX,velocityX,magnetStrength*2));
    element.setAttribute("vy", "" + interpolate(targetY,velocityY,magnetStrength*2));
}
function interpolate(target,current,rate){
    return current + ((target - current)*rate);
}
function computeCroissantVelocity(){
    croissants.forEach(element => {
        if(element.getAttribute("follow") == "true"){
            moveToMouse(element);
        }
        var velocityX = parseFloat(element.getAttribute("vx"));
        var velocityY = parseFloat(element.getAttribute("vy"));
        var posX = parseFloat(element.getAttribute("x"));
        var posY = parseFloat(element.getAttribute("y"));
        if (posX < boundsW && velocityX < 0){
            velocityX *= -croissantBounciness;
            posX = boundsW;
        }
        else if (posX > boundsE && velocityX > 0){
            velocityX *= -croissantBounciness;
            posX = boundsE;
        }
        if (posY < boundsN && velocityY < 0){
            velocityX *= croissantFriction;
            velocityY *= -croissantBounciness;
            posY = boundsN;
        }
        else if (posY >= boundsS && velocityY >= 0){
            velocityX *= 1-croissantFriction;
            if (velocityX*velocityX < 0.001){
                velocityX = 0;
            }
            if (velocityY*velocityY > 0.001){
                velocityY *= -croissantBounciness;
                posY = boundsS;
            }
            else if (velocityY != 0){
                velocityY = 0;
            }
        }
        else if(posY <= boundsS && element.getAttribute("follow") == "false"){
            velocityY = interpolate(gravity,velocityY,0.01);
        }
        element.setAttribute("vx", "" + velocityX);
        element.setAttribute("vy", "" + velocityY);
        element.setAttribute("x", "" + (posX + (velocityX*croissantSpeed)));
        element.setAttribute("y", "" + (posY + (velocityY*croissantSpeed))); 
    });
}
/**
 * physics logic for the lever
 */
function computeLeverVelocity(){
    var startY = 250;
    var endY = startY + leverTravel;
    if(leverHead.getAttribute("follow") == "true"){
        moveToMouse(leverHead);
    }
    var velocityY = parseFloat(leverHead.getAttribute("vy"));
    var posY = parseFloat(leverHead.getAttribute("y"));
    if (posY > endY && velocityY > 0){
        velocityY = 0;
        posY = endY;
        if(leverCooldown == false && leverDown == false && pressActive == false){
            leverDown = true;
            leverCooldown = true;
            pressActive = true;
        }
        else{
            leverDown = false;
        }
    }
    else if (posY <= startY && velocityY < 0){
        velocityY = 0;
        posY = startY;
        if(leverCooldown = true){
            leverCooldown = false;
        }
    }
    else if(posY > startY && leverHead.getAttribute("follow") == "false"){
        velocityY = interpolate(-1,velocityY,0.01);
    }
    var newPos = posY + (velocityY*10);
    var shaftHeight = ((endY - startY)/2) + (startY - newPos);
    if (shaftHeight > 0){
        leverShaft.setAttribute("height", shaftHeight + 10);
        leverShaft.setAttribute("y", newPos + 5);
    }
    else{
        leverShaft.setAttribute("y", ((endY - startY)/2) + startY + 5);
        leverShaft.setAttribute("height", newPos - (endY + startY)/2);
    }
    leverHead.setAttribute("vy", velocityY);
    leverHead.setAttribute("y", newPos);
}
/**
 * updates the position of all particles
 */
function computeParticles(){
    particles.forEach(element => {
        var velocityX = parseFloat(element.getAttribute("vx"));
        var velocityY = parseFloat(element.getAttribute("vy"));
        var posX = parseFloat(element.getAttribute("x"));
        var posY = parseFloat(element.getAttribute("y"));
        var life = parseFloat(element.getAttribute("life"));
        velocityY = interpolate(5+velocityY,velocityY,0.1);
        element.setAttribute("vx", "" + velocityX);
        element.setAttribute("vy", "" + velocityY);
        element.setAttribute("x", "" + (posX + (velocityX)));
        element.setAttribute("y", "" + (posY + (velocityY)));
        element.setAttribute("width", 16*(life/5));
        element.setAttribute("height",16*(life/5));
        life -= 60/1000;
        element.setAttribute("life", life);
        if(life < 0){
            element.remove();
            console.log("destroyed");
            particles = document.querySelectorAll(".particle");
        }
    });
}
/**
 * initializes a new croissant
 */
function createCroissant(){
    var croissant = document.createElementNS("http://www.w3.org/2000/svg","image");
    croissant.classList.add("croissant");
    croissant.classList.add("interactable")
    croissant.setAttribute("href", "assets/croissant.png");
    croissant.setAttribute("x", parseFloat(chute.getAttribute("x")) + 20);
    croissant.setAttribute("y", "0");
    croissant.setAttribute("vx", randFloat()*0.1);
    croissant.setAttribute("vy", interpolate(gravity, 0 ,0.01));
    croissant.setAttribute("width", "128");
    croissant.setAttribute("height", "128");
    console.log(croissant);
    croissant.addEventListener("mousedown",function(){spriteMouseDown(this)});
    chute.insertAdjacentElement("beforebegin",croissant);
    croissants = document.querySelectorAll(".croissant");
}

/**
 * animation logic for the hydraulic press
 */
function animatePress(){
    var pressTop = 150;
    var pressBottom = 380;
    var pressY = parseFloat(pressHead.getAttribute("y"));
    //press is active and moving down
    if(hitBottom == false && pressY < pressBottom){
        pressY += 1;
    }
    //press has reached the lowest position
    else if (hitBottom == false){
        //clamp y
        pressY = pressBottom
        hitBottom = true;
        gameAreaOffset.classList.add("screenshake");
        transformPressComponents(pressY)
        crushCroissant();
    }
    //after hit bottom events
    else if(hitBottom == true && pressY >= pressTop){
        pressY -= 1;
    }
    //idle
    else if(pressY <= pressTop){
        //clamp y
        pressY = pressTop
        pressActive = false;
        hitBottom = false;
        gameAreaOffset.classList.remove("screenshake");
        transformPressComponents(pressY)
    }
    if(pressY != pressBottom || pressY != pressTop){
        transformPressComponents(pressY)
    }
}
/**
 * calculates the transform of the hydraulic press components
 * @param {*} pressY Y pos of the hydraulic press 
 */
function transformPressComponents(pressY){
    pressShaftCover.setAttribute("height", pressY/2);
    pressShaft.setAttribute("height", pressY);
    pressHead.setAttribute("y", pressY);
}
/**
 * destroys all croissants within the crushing bounds
 * creates particles for each croissant
 */
function crushCroissant(){
    croissants.forEach(element => {
        if(checkInBound(element) == true){
            createParticles(element,30,30);
            element.remove();
            money += 5;
            moneyLabel.innerHTML = money;
        }
    });
}
/**
 * checks if a physics object is in the game bounds
 * @param {*} element 
 * @returns {boolean} true/false
 */
function checkInBound(element){
    var centerX = getCenterX(element);
    var centerY = getCenterY(element);
    if ((centerX <= crushBounds.right - gameWindow.x && centerX >= crushBounds.left - gameWindow.x) && (centerY >= crushBounds.top - gameWindow.y && centerY <= crushBounds.bottom - gameWindow.y) ){
        return true;
    }
    else{
        return false;
    }
}

/**
 * creates and manages the particles created when crushing croissants
 * @param {*} element croissant to start from
 * @param {*} amount amount of particles
 * @param {*} speed speed of the particles
 */
function createParticles(element, amount, speed){
    //clamp particle amount
    if(particles.length < 100){
        for(i = 0; i < amount; i ++){
            var particle = document.createElementNS("http://www.w3.org/2000/svg","image");
            particle.setAttribute("href", "assets/particle.png");
            particle.classList.add("particle");
            particle.setAttribute("x", getCenterX(element));
            particle.setAttribute("y", getCenterY(element));
            particle.setAttribute("vx", randFloat() * speed);
            particle.setAttribute("vy", randFloat() * speed/2);
            particle.setAttribute("width", "16");
            particle.setAttribute("height", "16");
            particle.setAttribute("life", ((1 + Math.random())*5).toFixed(1));
            element.insertAdjacentElement("beforebegin",particle);
        }
        particles = document.querySelectorAll(".particle");
        console.log(particles);
    }
}
/**
 * 
 * @returns random float for particle direction
 */
function randFloat(){
    return (Math.random() - 0.5) * 2;
}