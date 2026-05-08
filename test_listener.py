import asyncio
import json
from nats.aio.client import Client as NATSClient

async def main():
    # 1. Connect to the NATS broker
    nc = NATSClient()
    
    # Since we are running this from our host machine (Windows), 
    # we connect to localhost. (Inside Docker, they use 'nats')
    await nc.connect("nats://localhost:4222")
    print("🎧 Connected to NATS! Listening for events...")

    # 2. Define what happens when we hear a message
    async def message_handler(msg):
        subject = msg.subject
        data = json.loads(msg.data.decode())
        
        print("\n" + "="*50)
        print(f"🚨 EVENT DETECTED: {subject}")
        print("="*50)
        print(json.dumps(data, indent=4))
        print("="*50 + "\n")

    # 3. Subscribe to ALL inventory events using the wildcard '*'
    await nc.subscribe("inventory.*.*", cb=message_handler)

    # Keep the script running forever so it can listen
    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        print("\nDisconnecting...")
        await nc.close()

if __name__ == '__main__':
    # Run the async event loop
    asyncio.run(main())