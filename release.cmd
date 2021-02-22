@echo off
set VER=1.0.5

sed -i -E "s/version>.+?</version>%VER%</" install.rdf
sed -i -E "s/version>.+?</version>%VER%</; s/download\/.+?\/youtube-lazy-load-.+?\.xpi/download\/%VER%\/youtube-lazy-load-%VER%\.xpi/" update.xml

set XPI=youtube-lazy-load-%VER%.xpi
if exist %XPI% del %XPI%
zip -r9q %XPI% * -x .git/* .gitignore update.xml LICENSE README.md *.cmd *.xpi *.exe
