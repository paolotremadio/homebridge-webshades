# homebridge-webshades

## What is it?

**homebridge-webshades** is a clean and simple HTTP blinds or roller shutters management plugin for homebridge.

The features:
- You can control your own blinds/roller shutters apparatus with three minimalistic HTTP requests.
- The control is not a simple binary open/close: **it support percentages**. You can open your blinds at 50% or 65% for instance.
- Your blinds can still be manually operated. As long at the `get_current_position_url` returns the right value, this plugin will update iOS Home app periodically.

## How to use it

### Install it into your homebridge instance

````bash
npm install -g https://github.com/paolotremadio/homebridge-minimal-http-blinds
````

### Configure it

Here is an homebridge's `config.json` with the minimal valid configuration:

````json
{
    "accessories": [
        {
            "accessory": "Webshades",
            "name": "Kitchen Blinds",
            
            "adapter": "webshades",
            "adapterConfig": {
                "baseUrl": "http://localhost:8887",
                "deviceId": "aa:bb:cc:dd:ee:ff"
            }
        }
  
    ]
}
````

