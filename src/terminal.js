"use strict";
import { Terminal } from "https://cdn.jsdelivr.net/npm/xterm@5.3.0/+esm";
import { CanvasAddon } from 'https://cdn.jsdelivr.net/npm/xterm-addon-canvas@0.5.0/+esm';

let firstTerminalChar = true;
window.onload = function()
{
  var emulator = window.emulator = new V86({
      wasm_path: "/assets/computer/v86.wasm",
      memory_size: 32 * 1024 * 1024,
      vga_memory_size: 2 * 1024 * 1024,
      // screen_container: document.getElementById("screen_container"),
      bios: {
          url: "/assets/computer//seabios.bin",
      },
      vga_bios: {
          url: "/assets/computer/vgabios.bin",
      },
      cdrom: {
          url: "/assets/computer/modified_buildroot.iso",
      },
      autostart: true,
  });

  const term = new Terminal({  
    fontSize: 13,
    cols: 50,
    rows: 20,
    scrollback: Number.MAX_SAFE_INTEGER,
    allowProposedApi: true,
      theme : { background: "#000000", curser: "#ffffff", cursorAccent: '#323232cc',     
      foreground: "#ffffff",  
    } ,
});
  term.loadAddon(new CanvasAddon());
  term.open(document.getElementById("term"));

    window.term = term
    // fitAddon.fit();
    let msg = "booting up...";
    function write(index) {
        if (index < msg.length) {
            term.write(msg[index]);
            // Correct setTimeout usage
            setTimeout(() => write(index + 1), 100); // 1.2s seems very long, changed to 200ms
        }
    }
    write(0);
    

    // SERIAL → XTERM OUTPUT, we have to be hacky to get a first terminal char in to it
    emulator.add_listener("serial0-output-byte", function(byte) {
        if (firstTerminalChar){
            const myEvent = new CustomEvent('vmOn', {
                detail: { message: 'Hello World!' }, // Data to pass
                bubbles: true,                       // Allow event to bubble up the DOM
                cancelable: true                     // Allow preventDefault()
            });

            // 2. Launch (dispatch) the event from the document
            document.dispatchEvent(myEvent);
            firstTerminalChar=false
        }
        term.write(String.fromCharCode(byte));
    });

    // // XTERM INPUT → SERIAL
    term.onData(function(data) {
        data = data.replace(/\n/g, "\r\n");
        emulator.serial0_send(data)
    })

    window.addEventListener("resize", () => { term.fit && term.fit(); });

    function keyToChar(e) {
      if (e.key.length === 1) return e.key; // normal chars

      switch (e.key) {
        case "Enter": return "\r";
        case "Tab": return "\t";
        case "Backspace": return "\x7f";
        case "Escape": return "\x1b";
        default: return null;
      }
    }

    window.addEventListener("keydown", (e) => {
      e.preventDefault(); // stops browser shortcuts

      console.log(e)
      // term.write(keyToChar(e));              // xterm display
      emulator.serial0_send(keyToChar(e));   // VM input
    });
    
    //  document.addEventListener('Esc', (e) => {
    //     term.focus();
    //     term.write(String.fromCharCode(27));
    //     emulator.serial0_send(String.fromCharCode(27))
    // });
    //  document.addEventListener('Tab', (e) => {
    //     term.focus();
    //     term.write(String.fromCharCode(9));
    //     emulator.serial0_send(String.fromCharCode(9))
    // });
}