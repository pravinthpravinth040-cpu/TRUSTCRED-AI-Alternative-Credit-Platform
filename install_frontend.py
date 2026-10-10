import subprocess
import sys

print("Starting npm install for frontend...")
cmd = ["npm.cmd", "install", "--no-audit", "--no-fund", "--legacy-peer-deps"]
p = subprocess.Popen(
    cmd,
    cwd="frontend",
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1
)

for line in p.stdout:
    print(line, end="")

p.wait()
print(f"npm install finished with returncode: {p.returncode}")
sys.exit(p.returncode)
