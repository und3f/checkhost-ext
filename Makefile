ZIP=/usr/bin/env zip
EXTENSION=checkhost@check-host.net.xpi

all: $(EXTENSION)

$(EXTENSION): content/*
	$(ZIP) -9 $@ -r . -x .\* \*.swp

clean:
	$(RM) $(EXTENSION)
