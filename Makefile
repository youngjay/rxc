lib-cov:
	@rm -rf lib-cov
	@jscoverage lib lib-cov	

coverage: lib-cov
	RXC_COV=1 mocha -R html-cov > coverage.html	

lib-cmd:
	@node tool/build-lib-cmd.js

clean:
	@rm -rf lib-cmd
	@rm -rf lib-cov

install:
	@npm install

unit:
	@mocha

.PHONY: install