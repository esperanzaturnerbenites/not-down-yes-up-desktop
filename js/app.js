var notification = new NotificationC(),
	CTE = {}

$.ajaxSetup({
	headers: { "Desktop-App": "true" }
});

$("[title]").tooltip({placement:"bottom",delay: {show: 100, hide: 100}})

var colors = {
	colorBase : '#FFC799',
	colorBaseDark : '#E83D0C',
	colorGreen : '#45C44F',
	colorRed : '#FF0000',
	colorYellow : '#E8AD0C'
}

var five = require('johnny-five'),
	board,
	leds,
	port = false,
	buttons,
	host = "http://192.168.0.7:8000/"

//var serialPort = require('johnny-five/node_modules/serialport');

document.addEventListener('DOMContentLoaded', function() {
	$('#logout').click(function(){
		$.ajax({
			url: host + "logout",
			type:"GET",
			success: function(result){
				$("#containerAuthenticate").removeClass("hidden")
				$("#containerConfigRug").addClass("hidden")
				$("#btn-connect-board").off("click",connectBoard).prop("disabled",false)
				$("#btn-disconnect-board").off("click",disconnectBoard)
			}
		})
	})
	$('#closeWindow').click(function(){
		$.ajax({
			url: host + "logout",
			type:"GET",
			success: function(result){
				win.close()
			}
		})
	})
	$('#minimizeWindow').click(function(){win.minimize()})

	if(navigator.onLine) {
		$(".icon-connection-internet").css({color:colors.colorGreen})
		$("#formAuthenticate").submit(function(event){
			event.preventDefault()
			$.ajax({
				url: host + "authenticate",
				type:"POST",
				contentType :"application/x-www-form-urlencoded",
				data:$(this).serialize(),
				error: function(err){
					notification.show({msg:"Ha Ocurrido un Error al Conectarse con el Servidor",type:1})
					console.warn()
				},
				success: function(response){
					console.log(response)
					CTE = response.CTE
					$("#containerAuthenticate").addClass("hidden")
					$("#containerConfigRug").removeClass("hidden")

					$("#btn-connect-board").click(connectBoard)
					$("#btn-disconnect-board").click(disconnectBoard)
				}
			})
		})
	}else {
		$(".icon-connection-internet").css({color:colors.colorRed})
	}
})

function pressButton(button) {
	console.log("Pressed: ", button.pin)
	buttons.removeListener("press",pressButton)
	$("#statusButtons").html("")
	$.ajax({
		url: host + "arduino/data",
		data:{
			pinPress: button.custom.pin,
			//pinCorrect: $("#pinCorrect").val()
		},
		type:"POST",
		success: function(result){
			console.log(result)

			setTimeout(function(){
				buttons.on("press", pressButton)
				$("#statusButtons").html("Ya se puede presionar el botón.")
			},15000)

			if(result.isCorrect) onOffLeds()
		}
	})
}

function connectBoard(){
	$("#btn-connect-board")
		.off("click",connectBoard)
		.prop("disabled",true)
	$(".icon-connection-board").addClass("connecting")
	/*if(port) return port.open()
	serialPort.list(function (err, ports) {

		dataPort = ports.find(function(port) {return port.manufacturer == "Arduino__www.arduino.cc_"})
		if(!dataPort) {
			$(".icon-connection-board").removeClass("connecting")
			return console.log({message: "Verifique el tapete.",statusCode: CTE.INFORMATION})
		}

		port = new serialPort.SerialPort(dataPort.comName, {
			baudrate: 9600,
			buffersize: 1
		})


	})*/
			//board = new five.Board({port: port})
		board = new five.Board({port: "COM4"})

		board.on('ready', function() {

			$(".icon-connection-board").removeClass("connecting")
			$(".icon-connection-board").css({color:colors.colorYellow})

			/*
				Cable Naranja -> Pin 7: Boton 4
					Leds -> Pin 8,9,10

				Cable Azul -> Pin 6: Boton 3
					Leds -> 6,7

				Cable Verde -> Pin 4: Boton 2
					Leds -> A0,A1

				Cable Amarillo -> Pin 2: Boton 1
					Leds -> 11,12,13
			*/
			leds = new five.Leds([6,7,8,9,10,11,12,13,"A0","A1"]);
			buttons = new five.Buttons([
				{pin:2,custom :{pin: 1}},
				{pin:3,custom :{pin: 2}},
				{pin:4,custom :{pin: 3}},
				{pin:5,custom :{pin: 4}}
			])
			$("#statusButtons").html("Puedes Presionar el Boton")
			buttons.on("press", pressButton)
			onOffLeds()
			console.log("ready")

			this.on("exit", function() {
				leds.off();
				leds.stop();
				buttons.removeListener("press",pressButton)
			});
		})

		board.on('error', function(err) {
			$(".icon-connection-board").removeClass("connecting")
			console.log(err)
			$(".icon-connection-board").css({color:colors.colorRed})
		})
}

function onOffLeds(){
	leds.on()
	setTimeout(function(){leds.off()},6000)
}

function disconnectBoard(){
	port.close(function(err){
		console.log("port close")
		if(err) return {err:err}
		$(".icon-connection-board").css({color:colors.colorRed})
		return {message: "Tapete Desconectado",statusCode: CTE.CORRECT}
	})
}

function NotificationC (){
	var contenedorPrincipal = document.body

	var createMessage = function (data){
		var contenedorMSG = document.createElement("article")
		contenedorMSG.classList.add("contenedorMensaje")
		var mensaje = document.createElement("p")
		mensaje.innerHTML= data.msg
		contenedorMSG.classList.add("MSG")
		var icon = document.createElement("img")

		contenedorMSG.appendChild(icon)
		contenedorMSG.appendChild(mensaje)

		if (data.type == 0) icon.src = "/img/notifications/correcto.png"
		else if(data.type == 1) icon.src = "/img/notifications/incorrecto.png"
		else if(data.type == 2) icon.src = "/img/notifications/informacion.png"

		icon.classList.add("contenedorIcon")
		mensaje.classList.add("contenedorMensaje")

		return contenedorMSG
	}

	this.show = function (data){
		var contenedorMSG = createMessage(data),
			top = window.window.scrollY,
			time = data.time || 3000

		contenedorMSG.setAttribute("style", "top:" + top + "px")
		contenedorPrincipal.appendChild(contenedorMSG)
		setTimeout(this.hide.bind(this), time)
	}

	this.hide = function (){
		contenedorPrincipal.removeChild(contenedorPrincipal.lastChild)
	}
}
