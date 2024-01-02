> main.js
for i in `ls models`; do cat models/$i | grep -v ^[\n\s\t]*$ >> main.js; done
for i in `ls controllers`; do cat controllers/$i | grep -v ^[\n\s\t]*$ >> main.js; done
for i in `ls view`; do cat view/$i | grep -v ^[\n\s\t]*$ >> main.js; done
cat globals.js >> main.js
cat init.js >> main.js
