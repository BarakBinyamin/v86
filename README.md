# v86
A birthday present for my brother [Erez](https://github.com/BarakBinyamin/v86.git). A virtual linux computer embedded in a website...

See it [live]([barakbinyamin.github.io/v86/](https://barakbinyamin.github.io/v86/))!

# Making your own
The best way to update the linux image is to use the [update](update) directory to add in files. Theres a pre-built linux image in there.
the makefile will add all files in the files folder into the modified_buildroot.iso which we can move to replace our iso in the website

# How it works
There is an amazing project called [v86](https://github.com/copy/v86/tree/master) that turns x86 instructions into assembly and has emulates some hardware with javascript. It took alot of work to replicate the examples and update the existing images. making my own images didn't work out, I had to follow custom built image generations linked in the project. Only one worked, a custom buildroot distro, and it took 3+ hours to build. Unfortunatly that work was lost, but I believe I followed [the browser buildroot example](https://github.com/Darin755/browser-buildroot). I never changed anything in it though, it just built a waorking image

Anyhow, v86, I didn't gather what exactly was going on there, but hardware is usually memory mapped, meaning data between software and hardware is exchanged by shared memory. These emulated devices likely send back the data that would be expected by some hardware device when kernel calls read from those memory regions. I noticed there was a virtio library in the linux images recipes in example builds. This could also suggest that there is a standard open source virtualiztion layer that these virtual devices can interact with.

On the web side, the project uses ajn html canvas to show what the screen would be showing. This made it hard to interact with. It also exposes an updated undocumented api for serial communication. This can be seen by investigating the examples on the copysh site. Xterm.js is a great way to view and visualize serial data from the broswer, so that what we plug into. From there all we have to do is write some middleware if we want to send commands to the broswer rather than back to th user.

I hope you enjoy, if you have any comments or questions please write a post on this [github issue](https://github.com/BarakBinyamin/v86/issues/1).

Happy Birthday Erez!

# Top tools used
- https://sketchfab.com/ - assets
- PointerLockControls - navigation
- three.js - rendering
- howlerjs - positional audio management
- v86 - virtualized linux machine
- xtermjs - nice serial terminal
- yt-dlp - audio assets