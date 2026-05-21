// ============================================================
// CABOT BOT - cabot.js
// Bot de IA con voz para la Plataforma Ciudadana
// ============================================================

const CabotBot = {
    historial: [],
    estaAbierto: false,
    reconocimientoVoz: null,
    escuchando: false,
    timerInactividad: null,
    estadoActual: 'inicio',

    init() {
        this.crearWidget();
        const path = window.location.pathname;
        if (path.includes('/formulario/licencias')) {
            setTimeout(() => this.iniciarAsistenciaFormulario('licencias'), 600);
        } else if (path.includes('/formulario/padrones')) {
            setTimeout(() => this.iniciarAsistenciaFormulario('padrones'), 600);
        } else if (path.includes('/formulario/partidas')) {
            setTimeout(() => this.iniciarAsistenciaFormulario('partidas'), 600);
        } else {
            setTimeout(() => this.mostrarInicio(true), 600);
        }
        this.inicializarVoz();
    },

    reiniciarTimer() {
        clearTimeout(this.timerInactividad);
        this.timerInactividad = setTimeout(() => {
            const cont = document.getElementById('cabot-mensajes');
            const div = document.createElement('div');
            div.className = 'msg-bot';
            div.innerHTML = `<span class="msg-bot-icon">🤖</span><div class="msg-bot-text">⏱️ Parece que estás inactivo. Volviendo al inicio...</div>`;
            cont.appendChild(div);
            cont.scrollTop = cont.scrollHeight;
            setTimeout(() => this.mostrarInicio(false), 1500);
        }, 60000);
    },

    mostrarInicio(esPrimera) {
        this.estadoActual = 'inicio';
        clearTimeout(this.timerInactividad);
        const saludo = esPrimera
            ? '👋 <strong>¡Hola!</strong> Soy CABOT, tu asistente de trámites municipales.<br>¿En qué puedo ayudarte hoy?'
            : '🏠 De vuelta al inicio. ¿En qué puedo ayudarte?';
        this.agregarMensajeBotConBotones(saludo, [
            { label: '🚗 Licencias', accion: () => this.seleccionarSeccion('licencias') },
            { label: '📋 Padrón',    accion: () => this.seleccionarSeccion('padrones') },
            { label: '📄 Partidas',  accion: () => this.seleccionarSeccion('partidas') },
            { label: '📅 Mis Citas', accion: () => this.irMisCitas() },
        ]);
    },

    async seleccionarSeccion(seccion) {
        this.estadoActual = seccion;
        this.reiniciarTimer();
        const etiquetas = {
            licencias: '🚗 Licencias Municipales',
            padrones:  '📋 Padrones Municipales',
            partidas:  '📄 Partidas Registrales'
        };
        this.agregarMensajeUsuario(etiquetas[seccion]);
        this.mostrarTyping();
        document.getElementById('cabot-estado').textContent = 'Escribiendo...';

        const preguntas = {
            licencias: 'Lista brevemente los tipos de licencias municipales disponibles en la plataforma CABOT del Perú. Máximo 4 viñetas cortas.',
            padrones:  'Lista brevemente los tipos de padrones municipales disponibles en la plataforma CABOT del Perú. Máximo 4 viñetas cortas.',
            partidas:  'Lista brevemente los tipos de partidas registrales disponibles en la plataforma CABOT del Perú. Máximo 4 viñetas cortas.'
        };

        try {
            const response = await fetch('/api/cabot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensaje: preguntas[seccion], historial: [] })
            });
            const data = await response.json();
            this.quitarTyping();
            document.getElementById('cabot-estado').textContent = 'En línea';
            const respuesta = data.success ? data.respuesta : 'Aquí puedes consultar este tipo de trámite.';
            this.agregarMensajeBotConBotones(respuesta, [
                { label: `📂 Ir a ${etiquetas[seccion]}`, accion: () => this.navegarDashboard(seccion) },
                { label: '🏠 Inicio', accion: () => this.mostrarInicio(false) }
            ]);
        } catch (e) {
            this.quitarTyping();
            document.getElementById('cabot-estado').textContent = 'En línea';
            this.agregarMensajeBotConBotones('Puedes consultar y gestionar tus trámites aquí.', [
                { label: `📂 Ir a ${etiquetas[seccion]}`, accion: () => this.navegarDashboard(seccion) },
                { label: '🏠 Inicio', accion: () => this.mostrarInicio(false) }
            ]);
        }
    },

    navegarDashboard(seccion) {
        this.reiniciarTimer();
        // Si estamos en el dashboard, usar las funciones del dashboard
        if (typeof mostrarTramites === 'function') {
            mostrarTramites(seccion);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const etiquetas = {
                licencias: '🚗 Licencias Municipales',
                padrones:  '📋 Padrones Municipales',
                partidas:  '📄 Partidas Registrales'
            };
            setTimeout(() => {
                this.agregarMensajeBotConBotones(
                    `Mostrando <strong>${etiquetas[seccion]}</strong>. Puedes buscar y filtrar registros. ¿Deseas agendar una cita?`,
                    [
                        { label: '📅 Agendar Cita', accion: () => this.irMisCitas() },
                        { label: '🏠 Inicio', accion: () => this.mostrarInicio(false) }
                    ]
                );
            }, 400);
        } else {
            // Si estamos en un formulario, redirigir al dashboard
            window.location.href = `/dashboard#${seccion}`;
        }
    },

    irMisCitas() {
        this.estadoActual = 'citas';
        this.reiniciarTimer();
        this.agregarMensajeUsuario('📅 Mis Citas');
        if (typeof mostrarCitas === 'function') {
            mostrarCitas();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.location.href = '/dashboard';
            return;
        }
        setTimeout(() => {
            this.agregarMensajeBotConBotones(
                '📅 ¿Qué tipo de trámite deseas agendar?',
                [
                    { label: '🚗 Cita Licencias', accion: () => { window.location.href = '/formulario/licencias'; } },
                    { label: '📋 Cita Padrón',    accion: () => { window.location.href = '/formulario/padrones'; } },
                    { label: '📄 Cita Partidas',  accion: () => { window.location.href = '/formulario/partidas'; } },
                ]
            );
        }, 400);
    },

    iniciarAsistenciaFormulario(tipo) {
        this.estadoActual = `form_${tipo}`;
        this.reiniciarTimer();

        const campos = {
            licencias: ['Tipo Resolución','Expediente','Año Expediente','RUC','Área','Costo Trámite','Departamento','Provincia','Distrito','Ubigeo'],
            padrones:  ['Departamento','Provincia','Distrito','Ubigeo','Tipo','Fecha Solicitud','Razón Social'],
            partidas:  ['Año Inscripción','Mes Inscripción','Departamento','Provincia','Distrito','Nacionalidad']
        };

        const nombres = { licencias: 'Licencias', padrones: 'Padrón', partidas: 'Partidas' };

        this.agregarMensajeBotConBotones(
            `📋 Formulario <strong>${nombres[tipo]}</strong>. ¿Deseas que te ayude a completar los campos?`,
            [
                { label: '✅ Sí, ayúdame', accion: () => this.pedirDatosFormulario(tipo, campos[tipo], 0, []) },
                { label: '❌ No, lo lleno yo', accion: () => this.agregarMensajeBotConBotones('De acuerdo. Completa el formulario y presiona Guardar Cita cuando termines.', [
                    { label: '🏠 Inicio', accion: () => { window.location.href = '/dashboard'; } }
                ])},
                { label: '🏠 Inicio', accion: () => { window.location.href = '/dashboard'; } }
            ]
        );
    },

    pedirDatosFormulario(tipo, campos, indice, valores) {
        this.reiniciarTimer();
        if (indice >= campos.length) {
            // Todos los campos completados, llenar el formulario
            this.llenarFormulario(tipo, campos, valores);
            return;
        }

        this.agregarMensajeBotConBotones(
            `Campo ${indice + 1} de ${campos.length}:<br><strong>${campos[indice]}</strong>`,
            [
                { label: '🏠 Cancelar', accion: () => { window.location.href = '/dashboard'; } }
            ]
        );

        // Esperar input del usuario
        this._esperandoCampo = { tipo, campos, indice, valores };
    },

    llenarFormulario(tipo, campos, valores) {
        this.estadoActual = `confirmando_${tipo}`;
        // Mapear campos a nombres de inputs del formulario
        const mapas = {
            licencias: ['tipo_resolucion','expediente','anio_expediente','ruc','area','costo_tramite','departamento','provincia','distrito','ubigeo'],
            padrones:  ['departamento','provincia','distrito','ubigeo','tipo','fecha_solicitud','razon_social'],
            partidas:  ['anio_inscripcion','mes_inscripcion','depa_cont_l','prov_pais_l','dist_ciud_l','nacional_l']
        };

        const inputNames = mapas[tipo];
        inputNames.forEach((name, i) => {
            const input = document.querySelector(`[name="${name}"]`);
            if (input && valores[i] !== undefined) {
                input.value = valores[i];
                // Efecto visual
                input.style.border = '2px solid #1a73e8';
                setTimeout(() => { input.style.border = ''; }, 2000);
            }
        });

        this.agregarMensajeBotConBotones(
            '✅ Formulario completado. ¿Deseas guardar la cita?',
            [
                { label: '💾 Guardar Cita', accion: () => {
                    const form = document.querySelector('form');
                    if (form) form.submit();
                }},
                { label: '✏️ Cancelar', accion: () => this.iniciarAsistenciaFormulario(tipo) }
            ]
        );
    },

    toggleMute() {
    this.muteado = !this.muteado;
    document.getElementById('cabot-mute').textContent = this.muteado ? '🔇' : '🔊';
    if (this.muteado) window.speechSynthesis.cancel();
    },

    async enviarConsultaLibre(texto) {
        const lower = texto.toLowerCase().trim();

        // Si está esperando un campo del formulario
        if (this._esperandoCampo) {
            const { tipo, campos, indice, valores } = this._esperandoCampo;
            this._esperandoCampo = null;
            this.agregarMensajeUsuario(texto);
            valores.push(texto);
            this.pedirDatosFormulario(tipo, campos, indice + 1, valores);
            return;
        }

        // Si está confirmando guardar
        if (this.estadoActual && this.estadoActual.startsWith('confirmando_')) {
            const tipo = this.estadoActual.replace('confirmando_', '');
            if (/^s[ií]$|guardar|enviar|listo/.test(lower)) {
                this.agregarMensajeUsuario(texto);
                const form = document.querySelector('form');
                if (form) form.submit();
                return;
            }
            if (/^no$|cancel/.test(lower)) {
                this.agregarMensajeUsuario(texto);
                this.iniciarAsistenciaFormulario(tipo);
                return;
            }
        }


        // Si estamos en página de formulario
        if (window.location.pathname.includes('/formulario/')) {
            const path = window.location.pathname;
            const tipo = path.includes('licencias') ? 'licencias' : path.includes('padrones') ? 'padrones' : 'partidas';
            const campos = {
                licencias: ['Tipo Resolución','Expediente','Año Expediente','RUC','Área','Costo Trámite','Departamento','Provincia','Distrito','Ubigeo'],
                padrones:  ['Departamento','Provincia','Distrito','Ubigeo','Tipo','Fecha Solicitud','Razón Social'],
                partidas:  ['Año Inscripción','Mes Inscripción','Departamento','Provincia','Distrito','Nacionalidad']
            };
            if (/^s[ií]$|ayuda|ayúdame/.test(lower)) {
                this.agregarMensajeUsuario(texto);
                this.pedirDatosFormulario(tipo, campos[tipo], 0, []);
                return;
            }
            if (/^no$|solo|lleno/.test(lower)) {
                this.agregarMensajeUsuario(texto);
                this.agregarMensajeBotConBotones('De acuerdo. Completa el formulario y presiona Guardar Cita cuando termines.', [
                    { label: '🏠 Inicio', accion: () => { window.location.href = '/dashboard'; } }
                ]);
                return;
            }
            if (/guardar|enviar|listo/.test(lower)) {
                this.agregarMensajeUsuario(texto);
                const form = document.querySelector('form');
                if (form) form.submit();
                return;
            }
            if (/inicio|regresar|volver/.test(lower)) {
                window.location.href = '/dashboard';
                return;
            }
            return;
        }

        this.reiniciarTimer();

        if (this.estadoActual === 'citas') {
            if (/licen/.test(lower)) { window.location.href = '/formulario/licencias'; return; }
            if (/padr/.test(lower))  { window.location.href = '/formulario/padrones';  return; }
            if (/partid/.test(lower)){ window.location.href = '/formulario/partidas';  return; }
        }

        if (['licencias','padrones','partidas'].includes(this.estadoActual)) {
            if (/^s[ií]$|agendar/.test(lower)) { this.irMisCitas(); return; }
        }

        if (/licen/.test(lower)) {
            this.estadoActual === 'licencias' ? this.navegarDashboard('licencias') : this.seleccionarSeccion('licencias');
            return;
        }
        if (/padr[oó]n|padron|padrones/.test(lower)) {
            this.estadoActual === 'padrones' ? this.navegarDashboard('padrones') : this.seleccionarSeccion('padrones');
            return;
        }
        if (/partid/.test(lower)) {
            this.estadoActual === 'partidas' ? this.navegarDashboard('partidas') : this.seleccionarSeccion('partidas');
            return;
        }
        if (/^ir$|ir a|cargar|mostrar|ver/.test(lower)) {
            ['licencias','padrones','partidas'].includes(this.estadoActual) ? this.navegarDashboard(this.estadoActual) : this.irMisCitas();
            return;
        }
        if (/cita|agendar|mis citas/.test(lower)) { this.irMisCitas(); return; }
        if (/inicio|volver|regresar|menu|menú/.test(lower)) {
            (typeof mostrarTramites === 'function') ? this.mostrarInicio(false) : window.location.href = '/dashboard';
            return;
        }

        // Gemini para preguntas libres
        this.agregarMensajeUsuario(texto);
        this.historial.push({ role: 'user', content: texto });
        this.mostrarTyping();
        document.getElementById('cabot-estado').textContent = 'Escribiendo...';
        try {
            const response = await fetch('/api/cabot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensaje: texto, historial: this.historial })
            });
            const data = await response.json();
            this.quitarTyping();
            document.getElementById('cabot-estado').textContent = 'En línea';
            const respuesta = data.success ? data.respuesta : 'Lo siento, ocurrió un error.';
            this.historial.push({ role: 'assistant', content: respuesta });
            this.agregarMensajeBotConBotones(respuesta, [
                { label: '🏠 Inicio', accion: () => this.mostrarInicio(false) }
            ]);
        } catch (e) {
            this.quitarTyping();
            document.getElementById('cabot-estado').textContent = 'En línea';
            this.agregarMensajeBotConBotones('❌ Error de conexión.', [
                { label: '🏠 Inicio', accion: () => this.mostrarInicio(false) }
            ]);
        }
    },

    agregarMensajeBot(texto) {
        const cont = document.getElementById('cabot-mensajes');
        const div = document.createElement('div');
        div.className = 'msg-bot';
        div.innerHTML = `<span class="msg-bot-icon">🤖</span><div class="msg-bot-text">${texto}</div>`;
        cont.appendChild(div);
        cont.scrollTop = cont.scrollHeight;
        this.leerVoz(texto.replace(/<[^>]*>/g, ''));
        if (!this.estaAbierto) document.getElementById('cabot-badge').style.display = 'flex';
    },

    agregarMensajeBotConBotones(texto, botones) {
        const cont = document.getElementById('cabot-mensajes');
        const div = document.createElement('div');
        div.className = 'msg-bot';
        div.innerHTML = `<span class="msg-bot-icon">🤖</span><div class="msg-bot-text">${texto}<div class="msg-botones"></div></div>`;
        cont.appendChild(div);

        const contenedorBotones = div.querySelector('.msg-botones');
        botones.forEach(btn => {
            const el = document.createElement('button');
            el.className = 'msg-btn';
            el.textContent = btn.label;
            el.addEventListener('click', btn.accion);
            contenedorBotones.appendChild(el);
        });

        cont.scrollTop = cont.scrollHeight;
        this.leerVoz(texto.replace(/<[^>]*>/g, ''));
        if (!this.estaAbierto) document.getElementById('cabot-badge').style.display = 'flex';
    },

    agregarMensajeUsuario(texto) {
        const cont = document.getElementById('cabot-mensajes');
        const div = document.createElement('div');
        div.className = 'msg-user';
        div.innerHTML = `<div class="msg-user-text">${texto}</div>`;
        cont.appendChild(div);
        cont.scrollTop = cont.scrollHeight;
    },

    mostrarTyping() {
        const cont = document.getElementById('cabot-mensajes');
        const div = document.createElement('div');
        div.className = 'msg-bot msg-typing';
        div.id = 'cabot-typing';
        div.innerHTML = `<span class="msg-bot-icon">🤖</span><div class="msg-bot-text"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
        cont.appendChild(div);
        cont.scrollTop = cont.scrollHeight;
    },

    quitarTyping() {
        const t = document.getElementById('cabot-typing');
        if (t) t.remove();
    },

    toggleChat() {
        this.estaAbierto = !this.estaAbierto;
        const chat = document.getElementById('cabot-chat');
        if (this.estaAbierto) {
            chat.className = 'cabot-chat-abierto';
            document.getElementById('cabot-badge').style.display = 'none';
            document.getElementById('cabot-toggle-icon').textContent = '✕';
            document.getElementById('cabot-input').focus();
            this.reiniciarTimer();
        } else {
            chat.className = 'cabot-chat-cerrado';
            document.getElementById('cabot-toggle-icon').textContent = '🤖';
            clearTimeout(this.timerInactividad);
        }
    },

    enviar() {
        const input = document.getElementById('cabot-input');
        const texto = input.value.trim();
        if (!texto) return;
        input.value = '';
        this.enviarConsultaLibre(texto);
    },

    teclaPresionada(e) { if (e.key === 'Enter') this.enviar(); },

    inicializarVoz() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        this.reconocimientoVoz = new SR();
        this.reconocimientoVoz.lang = 'es-PE';
        this.reconocimientoVoz.continuous = false;
        this.reconocimientoVoz.interimResults = false;
        this.reconocimientoVoz.onresult = (e) => {
            document.getElementById('cabot-input').value = e.results[0][0].transcript;
            this.enviar();
        };
        this.reconocimientoVoz.onend = () => {
            this.escuchando = false;
            document.getElementById('cabot-mic').classList.remove('escuchando');
            document.getElementById('cabot-estado').textContent = 'En línea';
        };
        this.reconocimientoVoz.onerror = () => {
            this.escuchando = false;
            document.getElementById('cabot-mic').classList.remove('escuchando');
        };
    },

    toggleVoz() {
        if (!this.reconocimientoVoz) {
            this.agregarMensajeBot('⚠️ Tu navegador no soporta reconocimiento de voz. Usa Chrome.');
            return;
        }
        if (this.escuchando) {
            this.reconocimientoVoz.stop();
        } else {
            this.escuchando = true;
            document.getElementById('cabot-mic').classList.add('escuchando');
            document.getElementById('cabot-estado').textContent = '🎤 Escuchando...';
            this.reconocimientoVoz.start();
        }
    },

    leerVoz(texto) {
        if (!window.speechSynthesis || this.muteado) return;
        if (!window.speechSynthesis) return;
        texto = texto.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FEFE}]|[\u{1F900}-\u{1F9FF}]/gu, '');
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = 'es-PE'; u.rate = 1.05; u.pitch = 1; u.volume = 0.8;
        const voces = window.speechSynthesis.getVoices();
        const voz = voces.find(v => v.lang.startsWith('es')) || voces[0];
        if (voz) u.voice = voz;
        window.speechSynthesis.speak(u);
    },

    crearWidget() {
        const widget = document.createElement('div');
        widget.id = 'cabot-widget';
        widget.innerHTML = `
            <button id="cabot-toggle" onclick="CabotBot.toggleChat()" title="Abrir CABOT">
                <span id="cabot-toggle-icon">🤖</span>
                <span id="cabot-badge" class="cabot-badge" style="display:none">1</span>
            </button>
            <div id="cabot-chat" class="cabot-chat-cerrado">
                <div class="cabot-header">
                    <div class="cabot-header-info">
                        <div class="cabot-avatar">🤖</div>
                        <div>
                            <div class="cabot-nombre">CABOT</div>
                            <div class="cabot-estado" id="cabot-estado">En línea</div>
                        </div>
                    </div>
                    <button id="cabot-mute" onclick="CabotBot.toggleMute()" title="Silenciar voz">🔊</button>
                    <button class="cabot-cerrar" onclick="CabotBot.toggleChat()">✕</button>
                </div>
                <div id="cabot-mensajes" class="cabot-mensajes"></div>
                <div class="cabot-input-area">
                    <input type="text" id="cabot-input" placeholder="Escribe tu consulta..."
                        onkeypress="CabotBot.teclaPresionada(event)" />
                    <button id="cabot-mic" onclick="CabotBot.toggleVoz()" title="Hablar">🎤</button>
                    <button id="cabot-send" onclick="CabotBot.enviar()" title="Enviar">➤</button>
                </div>
            </div>
        `;
        document.body.appendChild(widget);

        // Arrastre con snap automático
        const toggle = document.getElementById('cabot-toggle');
        let isDragging = false;
        let startX, startY, startTop;

        toggle.addEventListener('mousedown', (e) => {
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            const rect = widget.getBoundingClientRect();
            startTop = rect.top;
            widget.style.transition = 'none';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });

        const onMouseMove = (e) => {
            const dx = Math.abs(e.clientX - startX);
            const dy = Math.abs(e.clientY - startY);
            if (dx > 5 || dy > 5) isDragging = true;
            if (isDragging) {
                const newTop = startTop + (e.clientY - startY);
                widget.style.top = `${Math.max(10, Math.min(newTop, window.innerHeight - 80))}px`;
                widget.style.bottom = 'auto';
                widget.style.right = '25px';
                widget.style.left = 'auto';
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            if (isDragging) {
                widget.style.transition = 'top 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                const currentTop = parseFloat(widget.style.top);
                const mitad = window.innerHeight / 2;
                if (currentTop < mitad) {
                    // Snap arriba
                    widget.style.top = '25px';
                    widget.dataset.posicion = 'arriba';
                } else {
                    // Snap abajo
                    widget.style.top = `${window.innerHeight - 80}px`;
                    widget.dataset.posicion = 'abajo';
                }
                // Ajustar chat según posición
                const chat = document.getElementById('cabot-chat');
                if (widget.dataset.posicion === 'arriba') {
                    chat.style.bottom = 'auto';
                    chat.style.top = '75px';
                } else {
                    chat.style.top = 'auto';
                    chat.style.bottom = '75px';
                }
                toggle.addEventListener('click', (e) => e.stopPropagation(), { once: true });
            }
        };

        this.agregarEstilos();
    },

    agregarEstilos() {
        const style = document.createElement('style');
        style.textContent = `
            #cabot-widget { position:fixed; bottom:25px; right:25px; z-index:9999; font-family:'Segoe UI',sans-serif; }
            #cabot-toggle { width:62px; height:62px; border-radius:50%; background:linear-gradient(135deg,#1a73e8,#0d47a1); border:none; cursor:pointer; font-size:28px; box-shadow:0 4px 20px rgba(26,115,232,0.5); transition:transform 0.2s,box-shadow 0.2s; position:relative; display:flex; align-items:center; justify-content:center; }
            #cabot-toggle:hover { transform:scale(1.1); box-shadow:0 6px 25px rgba(26,115,232,0.7); }
            .cabot-badge { position:absolute; top:-4px; right:-4px; background:#e53935; color:white; border-radius:50%; width:20px; height:20px; font-size:11px; display:flex; align-items:center; justify-content:center; font-weight:bold; }
            #cabot-chat { position:absolute; bottom:75px; right:0; width:360px; background:#fff; border-radius:18px; box-shadow:0 10px 40px rgba(0,0,0,0.18); overflow:hidden; display:flex; flex-direction:column; transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275); }
            .cabot-chat-cerrado { opacity:0; transform:scale(0.8) translateY(20px); pointer-events:none; max-height:0; }
            .cabot-chat-abierto { opacity:1; transform:scale(1) translateY(0); pointer-events:all; max-height:580px; }
            .cabot-header { background:linear-gradient(135deg,#1a73e8,#0d47a1); padding:14px 16px; display:flex; align-items:center; justify-content:space-between; color:white; }
            .cabot-header-info { display:flex; align-items:center; gap:10px; }
            .cabot-avatar { font-size:26px; background:rgba(255,255,255,0.2); border-radius:50%; width:42px; height:42px; display:flex; align-items:center; justify-content:center; }
            .cabot-nombre { font-weight:700; font-size:16px; letter-spacing:1px; }
            .cabot-estado { font-size:12px; opacity:0.85; }
            .cabot-cerrar { background:rgba(255,255,255,0.2); border:none; color:white; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:14px; }
            .cabot-cerrar:hover { background:rgba(255,255,255,0.35); }
            #cabot-mute { background:rgba(255,255,255,0.2); border:none; color:white; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:14px; margin-right:4px; }
            #cabot-mute:hover { background:rgba(255,255,255,0.35); }
            .cabot-mensajes { height:370px; overflow-y:auto; padding:16px; background:#f8f9fa; display:flex; flex-direction:column; gap:10px; scroll-behavior:smooth; }
            .cabot-mensajes::-webkit-scrollbar { width:4px; }
            .cabot-mensajes::-webkit-scrollbar-thumb { background:#ccc; border-radius:2px; }
            .msg-bot { display:flex; gap:8px; align-items:flex-start; }
            .msg-bot-icon { font-size:20px; flex-shrink:0; margin-top:4px; }
            .msg-bot-text { background:white; border:1px solid #e0e0e0; border-radius:16px 16px 16px 4px; padding:10px 14px; font-size:13.5px; color:#333; line-height:1.6; max-width:90%; box-shadow:0 1px 3px rgba(0,0,0,0.06); }
            .msg-user { display:flex; justify-content:flex-end; }
            .msg-user-text { background:linear-gradient(135deg,#1a73e8,#0d47a1); color:white; border-radius:16px 16px 4px 16px; padding:10px 14px; font-size:13.5px; line-height:1.5; max-width:80%; }
            .msg-typing .msg-bot-text { display:flex; gap:4px; align-items:center; padding:12px 16px; }
            .typing-dot { width:7px; height:7px; background:#999; border-radius:50%; animation:typingBounce 1.2s infinite; }
            .typing-dot:nth-child(2) { animation-delay:0.2s; }
            .typing-dot:nth-child(3) { animation-delay:0.4s; }
            @keyframes typingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
            .msg-botones { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
            .msg-btn { background:#e8f0fe; color:#1a73e8; border:1px solid #c5d9fb; border-radius:20px; padding:6px 12px; font-size:12px; cursor:pointer; transition:all 0.2s; font-weight:500; font-family:'Segoe UI',sans-serif; }
            .msg-btn:hover { background:#1a73e8; color:white; }
            .cabot-input-area { padding:10px 12px; background:white; border-top:1px solid #ececec; display:flex; gap:8px; align-items:center; }
            #cabot-input { flex:1; border:1.5px solid #e0e0e0; border-radius:22px; padding:9px 14px; font-size:13.5px; outline:none; transition:border 0.2s; font-family:inherit; }
            #cabot-input:focus { border-color:#1a73e8; }
            #cabot-mic, #cabot-send { width:38px; height:38px; border-radius:50%; border:none; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0; }
            #cabot-mic { background:#f0f0f0; color:#555; }
            #cabot-mic:hover { background:#e0e0e0; }
            #cabot-mic.escuchando { background:#e53935; color:white; animation:micPulse 1s infinite; }
            @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(229,57,53,0.4)} 50%{box-shadow:0 0 0 8px rgba(229,57,53,0)} }
            #cabot-send { background:linear-gradient(135deg,#1a73e8,#0d47a1); color:white; }
            #cabot-send:hover { opacity:0.85; transform:scale(1.05); }
        `;
        document.head.appendChild(style);
    }
};

document.addEventListener('DOMContentLoaded', () => { CabotBot.init(); });