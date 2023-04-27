docker run --name mongodb -d --network host mongo:5.0.17
# docker build -f frontend.dockerfile -t kahoot-frontend .
docker run --network host --name kahoot-frontend -v /root/kahoot-server/frontend:/workspace node:bullseye-slim tail -f /dev/null