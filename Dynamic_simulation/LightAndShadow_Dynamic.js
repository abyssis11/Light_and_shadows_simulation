/* ZADATAK:
Light and shadows - Jedna pozicija u gridu je izvor svijetla. Na ostatku grida je random
generirano "kamenje" koje je prepreka svijetlu. Prikazati kako se osvijetli okolina
uzimajući u obzor to kamenje.
*/
const c = document.getElementById("canvas");
const ctx = c.getContext("2d");
ctx.strokeStyle = "#777";
ctx.clearRect(0,0,canvas.width,canvas.height);

// Broj kamenja i njihova velicina (prikazuju se u obliku kvadrata)
const sizeOfrects=50;
const Nrects = 5;

// Duljina linije, trebati ce nam kasnije kod projeciranja zraka
const lineDistance = (x1, y1, x2, y2) => (Math.hypot(x2 - x1, y2 - y1));
const diagonal = lineDistance(0, 0, canvas.width, canvas.height);

// funkcija Math.atan2(y, x) vraca radiane pa ih pretvaramo u stupnjeve
// napomena: vraca kut izmedju -180 i 180
const calcAngleDegrees = (x, y) => (Math.atan2(y, x) * 180 / Math.PI);

// stvaramo tocku
const dot = (x, y) => ({x, y});
// edge i line nam koriste kod projeciranje zraka i stvaranje svjetla
const edge = (pos=[0,0], angle=0) => ({pos, angle});
const line = (pos=[0,0], lenght=0) => ({pos, lenght});

// sortiramo polje ali tako da ne mjenjamo orginalno polje, [...list] - spred operator kako nebi mjenjali orginalni array
const projectedRaysSorted = list => [...list].sort((a, b) => { return a.angle-b.angle; });

// funkcije koje vracaju random x i y poziciju unutar canvasa ali osiguravaju da se kvadrati u potpunosti nalaze unutar njegovih okvira
const Xposition = (size) => (x=Math.random() * canvas.width) > (canvas.width - size) ? x-size : x;
const Yposition = (size) => (y=Math.random() * canvas.height) > (canvas.height - size) ? y-size : y;
        
// funkcije koje vracaju head i tail liste (po uzoru na oz)
const head = ([h]) => h;
const tail = ([, ...t]) => t;
        
 // funkcija koja spaja dvije liste u novu listu
 function append(lista, accumulator){
     if(!lista.length){
         return accumulator;
     }else{
         //jer head vrati broj a ne listu
         h=[head(lista)];
         return append(tail(lista), h.concat(accumulator));
     }
}

// pomocna funkcija kojom oznacujemo vrhove kvadrata (sluzi samo za laksu vizualnu reprezentaciju)
function drawCircle(x, y, r) {
     ctx.beginPath();
     ctx.arc(x, y, r, 0, 2 * Math.PI);
     ctx.stroke();
 }

// stvaramo kvadrat (kamenje) na random poziciji te ga crtamo
// pomocu funkcija Xposition() i Yposition() dobivamo ishodisnu tocku kvadrata (gornja lijeva tocka)
// od ishodisne tocke kvadrata oznacujemo ostale vrhove (A,B,C,D)
// sve vrhove stovrenog kvadrata vracamo kao listu
function createRect(size, N, accumulator){
    if(N==0){
        return accumulator;
    }
    const x = Xposition(size);
    const y = Yposition(size);

    const rect = [
                x, y,                  //A
                x + size, y,           //B
                x + size, y + size,    //C
                x, y + size            //D 
            ]
    return createRect(size, N-1, accumulator.concat(rect))     
}

// POPRAVITI!
//oznacujemo vrhove s krugom (drawCircle())
function drawRect(list, size){
    list.forEach((element, index, arr) => {
        if(index===0 || index%8===0){
            ctx.strokeRect(element, arr[index+1], size, size);

            const radius = 5;
            drawCircle(element, arr[index+1], radius);
            drawCircle(element + size, arr[index+1], radius);
            drawCircle(element + size, arr[index+1] + size, radius);
            drawCircle(element, arr[index+1] + size, radius);
        }
    })
}

// Nije potrebno izmisljati toplu vodu
// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {

    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false
    }

    // da ne provjeravamo ako se sjecu u vrhovima di bi se i trebali sjeci
    if((x1==x3 && y1==y3) || (x1==x4 && y1==y4) || (x2==x3 && y2==y3) || (x2==x4 && y2==y4)){
        return false;
    }

    const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    // Lines are parallel
    if (denominator === 0) {
        return false
    }

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false
    }

    // Return a object with the x and y coordinates of the intersection
    const x = x1 + ua * (x2 - x1)
    const y = y1 + ua * (y2 - y1)

    return {x, y}
}

// pomocna funkcija u kojoj sortiramo krajnje tocke (one koje je dosegla prilikom kolizije) ovisno o duljini zrake
function closestIntersection(intersections, beginingX, beginingY, accumulator){
        // kad smo prosli sve kolizije sortiramo akumulator i vracamo samo tocku koja predstavlja najkracu zraku (najblizu koliziju)        
        if(intersections.length==0){
            // [...list] - spred operator kako nebi mjenjali orginalni array
            return [...accumulator].sort(function(a, b){return b.lenght-a.lenght}).pop();
        }
        else{
            // ako nema kolizije izbacujemo koliziju iz polja kolizija i provjeravamo dalje
            if(intersections[0]==false){
                //intersections.pop();
                return closestIntersection(tail(intersections), beginingX, beginingY, accumulator);
            }else{
                // ako ima kolizije spremamo tocku kolizije u akumulator i izbacujemo ju iz polja kolizija i nastavljamo dalje
                const point = head(intersections);
                // accumulator.push(line([point.x, point.y], lineDistance(beginingX, beginingY, point.x, point.y)));
                const acc = append(accumulator, [line([point.x, point.y], lineDistance(beginingX, beginingY, point.x, point.y))]);
                return closestIntersection(tail(intersections), beginingX, beginingY, acc);
            }
        }
}

// pomocna funkcija u kojoj provjeravamo koliziju zraka s kamenjem 
function drawLine(beginingX, beginingY, endingX, endingY, rectList, size){
    // krajnja tocka zrake (u pocetku je to uvijek vrh kvadrata ili u slucaju offsetanih zraka to je tocka na udaljenosti d)
    const ending0 = [dot(endingX, endingY)];
    const ending1 = rectList.map((element, index, arr) => {
                if(index===0 || index%8===0){
                    // A(0,1) | B(2,3) | C(4,5) | D(6,7) | A(8, 9) | B(10, 11) | C ...

                    // za prosljedjenu zraku provjeravamo ako presjeca bilo koju stranicu kvadrata
                    return [
                        intersect(beginingX, beginingY, endingX, endingY, element, arr[index+1], element+size, arr[index+1]),
                        intersect(beginingX, beginingY, endingX, endingY, element+size, arr[index+1], element+size, arr[index+1]+size),
                        intersect(beginingX, beginingY, endingX, endingY, element+size, arr[index+1]+size, element, arr[index+1]+size),
                        intersect(beginingX, beginingY, endingX, endingY, element, arr[index+1]+size, element, arr[index+1]),
                    ]
                }
            }).filter(el => el !== undefined); // odmah tu izbacimo

    // pretvaramo 2d array u 1d array
    const ending2 = [].concat(...ending1);
    const ending3 = append(ending2, ending0);
            
    // sortiramo kolizije ovisno o duljini zraka i vracamo samo onu zraku s najmanjom duljinom (najbliza kolizija)
    // ODNOSNO VRACAMO NJEZINU KRAJNJU TOCKU    
    const closestPoint = closestIntersection(ending3, beginingX, beginingY, []);

    // crtamo zraku iz sredista do krajenje tocke zrake
    // nije potrebno ali dobro za razumjevanje
    ctx.beginPath();
    ctx.moveTo(beginingX, beginingY);
    ctx.lineTo(closestPoint.pos[0], closestPoint.pos[1]);
    ctx.stroke();
    ctx.closePath();

    // vracamo zraku i njezin nagib 
    // parametri calcAngleDegrees() izgledaju tako jer trebamo pretvoriti koordinatni sustav canvasa u kartezijev koordinatni sustav (canvas ima ishodiste u gornjem lijevom kutu)
    return edge([closestPoint.pos[0], closestPoint.pos[1]], calcAngleDegrees(closestPoint.pos[0]-beginingX, beginingY-closestPoint.pos[1]));
}

// projeciramo zrake prema svim vrhovima svih kvadrata i provjeravamo koliziju na njihovom putu
// vracamo listu krajnjih tocaka svake zrake te njihov nagib 
function rays(centerX, centerY, size, d, accumulator, N){
    // projeciramo zrake prema njima i provjeravamo koliziju na njihovom putu
    //map() stvara novi array (i ne mjenja stari)
    const acc0 = accumulator.map((element, index, arr) => {
        if(index==0 || index%2==0){
            // x y   x y   x y   x y ...
            // 0 1 | 2 3 | 4 5 | 6 7 ...

            // offsetamo zraku
            // potreban nam je offsetana zraka kako bi osigurali da se kreirana ispravni poligon koji predstavlja svjetlost 
            // kad nebi projecirali zrake samo prema vrhovima kvadrata dosta podataka bi bilo izgubljeno izmedju njih  
            // Xnew = x + duzinaZrake * cos(kut)
            // Ynew = y + duzinaZrake * sin(kut)
            const angle = Math.atan2(arr[index+1]-centerY, element-centerX) // kut u radianim
            const xplus = element + d * Math.cos(angle+0.00001);
            const yplus = arr[index+1] + d * Math.sin(angle+0.00001);
            const xminus = element + d * Math.cos(angle-0.00001);
            const yminus = arr[index+1] + d * Math.sin(angle-0.00001);

            // prema svakom vrhu svakog kvadrata projeciramo zraku i njezinu offsetanu zraku za +-0.00001 kut 
            // u drawLine() provjeravamo kolizije zraku s svakom stranicom svakog kvadrata i vracamo zavrsne tocke svake zrake i njihov kut (nagib)
            return [drawLine(centerX, centerY, xminus, yminus, accumulator, size), 
                    drawLine(centerX, centerY, element, arr[index+1], accumulator, size),
                    drawLine(centerX, centerY, xplus, yplus, accumulator, size) ];   
        }
    });
    // pretvaramo 2d array u 1d array
    const acc1= [].concat(...acc0);
    // zrake koje projeciramo prema vrhovima canvasa
    // KORISTIMO CANVAS.WIDTH I HEIGHT (NIJE DEKLARATIVNO!!!)
    const linesToEdge = [
        drawLine(centerX, centerY, 0, 0, accumulator, size),
        drawLine(centerX, centerY, canvas.width, 0, accumulator, size),
        drawLine(centerX, centerY, canvas.width, canvas.height, accumulator, size),
        drawLine(centerX, centerY, 0, canvas.height, accumulator, size)
    ]
    // spajamo dvije liste u novu (ne mjenjamo ih)
    const acc2 = append(acc1, linesToEdge);
    const acc3 = acc2.filter(el => el !== undefined);

    // vracamo listu s svim zavrsnim tockama svih zraka i njihovim kutom nagiba
    return acc3;
   
}

// crtamo poligon svjetlosti
// spajamo krajnje tocke zraka poredanih po nagibu u jedan veliki poligon
function light(dots) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, canvas.height/2);
    dots.forEach((element ) => {
        ctx.lineTo(element.pos[0],element.pos[1]);
    });
    //spojimo na pocetak? closePath iz nekog razloga ne radi
    ctx.lineTo(dots[0].pos[0],dots[0].pos[1]);
    ctx.fill();
    ctx.closePath();
   //ctx.fill();
}

const rects = createRect(sizeOfrects, Nrects, []);

 // animation
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
var updateCanvas = true;
function drawLoop(){
    requestAnimationFrame(drawLoop);
    if(updateCanvas){
        // cistimo svaki frame da ne ostanu prethodni frameovi nacrtani
        ctx.clearRect(0,0,canvas.width,canvas.height);
        // crtamo kvadrate
        drawRect(rects, sizeOfrects)

        // stvaramo kvadrate (kamenja) i 
        // projeciramo zrake svjetlosti iz sredista (srediste je pocetna tocka svim zrakama) canvasa prema svim vrhovima kvadrata 
        // (i dodatno offsetane zrake za kut +-0.00001)
        // provjeravamo kolizije s kamenjem
        // dobivamo listu tocaka do koje je zraka NEOMETANO doputovala te kut nagiba njezine projekcije
        const projectedRays = rays(Mouse.x, Mouse.y, sizeOfrects, diagonal, rects, Nrects);

        // sortiramo zrake ovisno o kutu nagiba te ih tako sortirane spajamo u jedan veliki poligon koji čini svjetlost 
        light(projectedRaysSorted(projectedRays));
        updateCanvas = false;
    }
}

window.onload = function(){
    drawLoop();
};
      
// mouse
var Mouse = {
    x: canvas.width/2,
    y: canvas.height/2
};
canvas.onmousemove = function(event){	
    Mouse.x = event.clientX;
    Mouse.y = event.clientY;
    updateCanvas = true;
};