docker run --name mongodb -d --network host mongo:5.0.17
docker build -f frontend.dockerfile -t kahoot-frontend:latest .
docker run --network host --name kahoot-frontend -v `pwd`/frontend:/workspace kahoot-frontend:latest