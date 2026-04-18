.SILENT:

help:
	printf "\nusage: make build\n"
	printf "\nthis will create a modified_buildroot.iso in the same directory with all the files from the files folder\n\n"

update:
	docker build -t iso-ext2-modifier .
	docker run --name iso-ext2-modifier iso-ext2-modifier && \
	docker cp iso-ext2-modifier:/workspace/modified_buildroot.iso . && \
	docker rm iso-ext2-modifier

	
