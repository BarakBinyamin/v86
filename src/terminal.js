"use strict";
// nifty terminal library for viewing and passing data between terminals
import { Terminal } from "https://cdn.jsdelivr.net/npm/xterm@5.3.0/+esm";
// Library to make xterm view as canvas
import { CanvasAddon } from 'https://cdn.jsdelivr.net/npm/xterm-addon-canvas@0.5.0/+esm';

// Hacky workaround variable for the serial outbut buggin'
let firstTerminalChar = true;
let arcadeAPIon = false;
window.onload = function()
{
    // V86 emulator
    var emulator = window.emulator = new V86({
        wasm_path: "assets/computer/v86.wasm",
        memory_size: 32 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        bios: {
            url: "assets/computer/seabios.bin",
        },
        vga_bios: {
            url: "assets/computer/vgabios.bin",
        },
        cdrom: {
            url: "assets/computer/modified_buildroot.iso",
        },
        autostart: true,
    });

    // xterm setup
    const term = new Terminal({  
        fontSize: 13,
        cols: 50,
        rows: 20,
        scrollback: 0, //Number.MAX_SAFE_INTEGER,
        allowProposedApi: true,
        theme : { background: "#000000", curser: "#ffffff", cursorAccent: '#323232cc',     
        foreground: "#ffffff",  
        } ,
    });

    term.loadAddon(new CanvasAddon());
    // connect the xtermjs to the dom   
    term.open(document.getElementById("term"));
    // make the xterm terminal a global variable available to all the scripts via the window
    window.term = term

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
        // First char from term
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

        // next chars
        if (String.fromCharCode(byte).includes("@")){
            arcadeAPIon=!arcadeAPIon
            if (!arcadeAPIon){
                const myEvent = new CustomEvent('arcadeAPI', {
                    detail: { message: String.fromCharCode(byte) }, // Data to pass
                    bubbles: true,                                  // Allow event to bubble up the DOM
                    cancelable: true                               // Allow preventDefault()
                });
                document.dispatchEvent(myEvent);
            }
        }
        if (!arcadeAPIon){
            term.write(String.fromCharCode(byte));
        }else{
            const myEvent = new CustomEvent('arcadeAPI', {
                detail: { message: String.fromCharCode(byte) }, // Data to pass
                bubbles: true,                       // Allow event to bubble up the DOM
                cancelable: true                     // Allow preventDefault()
            });
            document.dispatchEvent(myEvent);
            term.write(String.fromCharCode(byte));
        }
    });

    // XTERM INPUT → SERIAL
    term.onData(function(data) {
        //  imoprtant for linux cmd line
        data = data.replace(/\n/g, "\r\n");
        emulator.serial0_send(data)
    })

    window.addEventListener("resize", () => { term.fit && term.fit(); });

    function keyToChar(e) {
      // pass normal characters
      if (e.key.length === 1) return e.key; // normal chars

      // pass special chars
      switch (e.key) {
        case "Enter": return "\r";
        case "Tab": return "\t";
        case "Backspace": return "\x7f";
        case "Escape": return "\x1b";
        default: return null;
      }
    }

    window.addEventListener("keydown", (e) => {
      // stops browser shortcuts
      e.preventDefault(); 

     if (window?.controls && !window?.controls?.isLocked){
        // VM input
        emulator.serial0_send(keyToChar(e)); 
      }else{
        console.log(window?.controls.isLocked)
      }
    });

}