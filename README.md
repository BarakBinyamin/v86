# v86
A birthday present for my brother [Erez](https://github.com/BarakBinyamin/v86.git). A virtual linux computer embedded in a website...

See it [live](https://barakbinyamin.github.io/v86/)

# Making your own
The best way to update the linux image is to use the [update](update) directory to add in files. Theres a pre-built linux image in there.
the makefile will add all files in the files folder into the modified_buildroot.iso which we can move to replace our iso in the website

# How it works
There is an amazing project called [v86](https://github.com/copy/v86/tree/master) that maps x86 instructions into web assembly and has emulated some hardware using javascript. It took alot of work to replicate one of the examples and update an existing images. Making my own image was even more challenging. I had to follow the flow for custom built image generation linked in the project. Only one worked, a custom buildroot distro, and it took 3+ hours to build. Unfortunatly that work was lost, but I believe I followed [the browser buildroot example](https://github.com/Darin755/browser-buildroot). I never changed anything in it though, it just built a working image

Anyhow, v86, I didn't gather what exactly was going on there, but hardware is usually memory mapped, meaning data between software and hardware is exchanged by shared memory. The emulated devices send back the data that would be expected from a real hardware device when kernel calls read from those memory regions. I noticed there was a virtio library in the linux images recipes in example builds. This could also suggest that there is a standard open source virtualiztion layer that these virtual devices can interact with.

On the web side, the v86 project uses an html canvas to show the virtualized screen. This made it hard to interact with. Thankfully v86 also exposes an updated undocumented api for serial communication. This can be seen by investigating the examples on the [copysh site](https://copy.sh/v86/). Xterm.js is a great way to view and visualize serial data from the broswer, so thats what we plug into. From there all we have to do is write some middleware if we want to send commands to the browser for some reason.

I hope you enjoy, if you have any comments or questions please write a post on this [github issue](https://github.com/BarakBinyamin/v86/issues/1).

Happy Birthday Erez!

# Run locally
A basic example with xterm that you could write middleware to catch serial data
```bash
git clone https://github.com/BarakBinyamin/v86.git
cd v86/basic
python3 -m http.server # -> go to http://localhost:8000 in yoour browser
```

The hosted version we see on github
```bash
git clone https://github.com/BarakBinyamin/v86.git
cd v86
python3 -m http.server # -> go to http://localhost:8000 in yoour browser
```

# Top tools used
- https://sketchfab.com/ - assets
- PointerLockControls - navigation
- three.js - rendering
- howlerjs - positional audio management
- v86 - virtualized linux machine
- xtermjs - nice serial terminal
- yt-dlp - audio assets
- docker