python3 -m venv env
source env/bin/activate
pip install -U pip
pip install -r requirements.txt

npm up npm
npm i
npm up electron
npm run build