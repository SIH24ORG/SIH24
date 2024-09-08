import requests
from threading import Thread

url = 'http://localhost:3000/payApi/balance'


def send_request():
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
    except requests.RequestException as e:
        print(f"Request failed: {e}")


num_threads = 200000


threads = []
for _ in range(num_threads):
    thread = Thread(target=send_request)
    threads.append(thread)
    thread.start()


for thread in threads:
    thread.join()

print("Finished sending requests")
