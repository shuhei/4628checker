export BUILD=build
test -d $BUILD || mkdir -p $BUILD
git archive --format=zip --out=$BUILD/4628.zip HEAD
