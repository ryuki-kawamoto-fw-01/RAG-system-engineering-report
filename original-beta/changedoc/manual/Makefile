lint: ## all lint
	black ./modules --line-length=140
	flake8 ./modules --ignore=E203,W503 --max-line-length=140
	isort ./modules --line-length=140
	mypy ./modules
	black ./function_app.py --line-length=140
	flake8 ./function_app.py --ignore=E203,W503 --max-line-length=140
	isort ./function_app.py --line-length=140
	mypy ./function_app.py