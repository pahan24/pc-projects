Version History

Changes in version 6.3.0:
- Removed mux option limitation on Shadowsocks and Reality config
- Update config security
Version below 6.3.0 no longer support locked config from latest version

Changes in version 6.2.12:
- Added and fixed new color state for profile ping

Changes in version 6.2.11:
- Added TAP ARM driver
- Added parse from link feature in Xray JSON
- Reconnect SSH on first failure
- Allow transport tcp-http with empty path
- Allow Xray JSON without inbound

Changes in version 6.2.10:
- New logo from community special thanks to Keyhan Majidzade
- Added IPv6 option to settings
- Updated TAP driver

Changes in version 6.2.9:
- Added SSH config reference, tap help icon in SSH config to see
- Update SSH Payload Generator and Added "enhanced option"
- Support config non ASCII format such emojis, non-latin chars, etc
- Improve UDP checker
- Reduced log size limit to 25 KB & auto clear log

Changes in version 6.2.8:
- Dropped Visual C++ redistributable
- Improve keepalive SSH
- Added Wireguard keepalive
- Added KCP seed option
- Added TAP driver fallback
- Added useful information why VPN service won't start
more detailed about this issue see requirements.txt
- Reverted Xray domain cache

Changes in version 6.2.7:
- Added Response Position option in SSH
if you're experiencing ssh not connecting, try changing this option
- Added Prevent DNS leak feature using firewall, enabled by default
- Update "What's my IP" UI
- Changed Xray default TLS Fingerprint "chrome" to "none"
- Added Xray geosite/geoip files
- Removed unnecessary proxy share feature in Tethering Mananger
- Fix Shadowsocksr dns leak

Changes in version 6.1.1:
- Fixed custom WebSocket path, was broken in previous version
- Cloudflare DNS as default DNS

Changes in version 6.1.0:
- Fixed Shadowsocksr connection
- Improved SSH Response Replacer

Changes in version 6.0.9:
- Excluded network interface type 53 (proprietary virtual/internal) from proxying
- Fixed DNSTT reconnection
- Global resolver DNS caching with TTL
- SSH client dynamic socks use random address/port if failed to bind
- Fixed SSH editor save error after using QR code scanner
- Fixed DNSTT mode udp
- Fixed WireGuard config
- Added WireGuard presharedkey option
- Removed SSH streaming timeouts
- Fixed minor bugs

Changes in version 6.0.0 beta:

We recommend to backup everything up before you install/upgrade to this version
to perform force update for existing installed app you can run install via cmd/powershell
with command "setup_name.exe /update"

-Removed old SSH mode
As stated in android version earlier, we decided to move it to the main page
to make it easier to control everything at once, if you had any existing
old SSH configurations it will be migrated as new SSH config at first app startup

-Replaced HTTP Proxy, Plink, Pdnsd and merged DNSTT and Xray core libraries with netmodcore
-Added native crash report Windows service app
-Moved default config dir to user Documents
-Added Wireguard protocol
-Removed settings option "Remove default gateway route"
-Removed SSH option "Enable compression"
-Removed HTTP Proxy local port option
-Added Xray fragment feature
-Added Xray XHTTP transport
-Updated Xray TLS ALPN list
-App UI Improvements
-Support ping for DNSTT and SSH
-No longer used routing table method for VPN tunneling, all sockets are bound
to main network interface, if your main network dns got leaked it's mostly caused by
Windows feature SMHNR/mDNS
-Improved TAP Manager uninstaller
-Added TLS version 1.3 to HTTP Proxy (part of SSH)
-VPN Support resume on power state sleep/hibernate
-Common config/protocol support export as file

Changes in version 5.3.1:
-Fix false positive sniffer detection

Changes in version 5.3.0:
-Fix installer
-Fix "What's my IP" and reworked UI

Changes in version 5.2.1:
-VPN Tunnel improvements

Changes in version 5.2.0:
-Fixed Xray bulk ping, was broken in v5.1.1
-Moved Xray mux options to settings,
also added XUDP Concurrency and XUDP Proxy UDP traffic options

Changes in version 5.1.1:
-Fixed SOCKS config link
-New Tethering Manager guide
-Fixed Xray core websocket path

Changes in version 5.1.0:
-Xray Socks supported no auth method
-Added timeout for resolving host
-Fix profile order
-Fix custom Xray json throws error if inbound has no host address

Changes in version 5.0.4:
-Reverted TAP adapter driver to v9.00.00.21 is 
due to incompatibility with some Windows versions

Changes in version 5.0.3:
-Fix TAP installer error dialog
-Fix Host to IP crashes
-Fix cancel update crashes

Changes in version 5.0.2:
-Fix crashes

Changes in version 5.0.1:
-Fix crashes

Changes in version 5.0.0:
-Updated Xray core version to 1.8.4
-Added Xray JSON text editor
-Added Shadowsocks protocol
-Support xtls reality
-Added feature ping all server (Xray only)
-Updated tap-windows drivers to 9.24.6.601
-Proxy Tethering supports SOCKS5 (Tethering Manager)
-Added Quick Ping (HTTP) floating action button
-Added connection uptime into start button
-Updated open source library licenses
-Dark theme improvements
-Redesigned toast message
-Removed HTTP port settings option
-Removed "reverse" fuction in Host to IP feature, now also added ipv6 result
-Fixes network routing
-SSH mode is now optional feature
-Fixes memory leaks

Note: version below 5.0.0 no longer receive new updates in the future

Changes in version 4.9.4:
-App startup crash fixes

Changes in version 4.9.2:
-Fixed scrollbar where user cannot press on track
-Added scrollbar arrow buttons
-Bug and crash fixes

Changes in version 4.9.0:
-Added uninstaller dialog to clear app data
-Bug fixes

Changes in version 4.8.0:
-Added feature attach log to window
-Bug fixes drag drop stuck when popup menu shown
-Bug fixes V2ray fakedns
-Bug fixes and improvements QR Code scanner

Changes in version 4.7.0:
-Added feature Update Checker in About tab
-Bug fixes VPN connection hangs

Changes in version 4.6.0:
-Added feature profile drag reorder

Changes in version 4.5.1:
-Downgraded plink version to 0.76 due to some servers not responding
-SSH SlowDNS support UDP/DOT/DOH mode but dns address form must be specified
example address for each modes

-UDP: "1.1.1.1:53"
-DOT: "1.1.1.1:853"
-DOH: "https://dns.example.com/dns-query"

leaving address with no port and doesn't not contain uri will use UDP mode

Changes in version 4.5.0:
-Added feature QR Code Scanner
-Added Dark Theme
-Renamed "V2Ray Mode" to "Extra Mode"
-Added feature SSH SlowDNS to extra mode
-Removed Trojan GO plugin since v2ray core already support trojan websocket (all Trojan GO configs will be converted to trojan)

Changes in version 4.4.0:
-Merged proxy tethering option to Tethering Manager dialog
-Bug fixes proxy tethering
-Updated plink library to 0.78

Changes in version 4.3.0:
-Added option to remove default gateway route

Changes in version 4.2.0:
-Updated Xray core to v1.6.1
-Support Xray websocket custom method path (ex. "CONNECT wss://host/")
-Improved qr code image quality

Changes in version 4.1.1:
-Fixed Tethering Manager
-Fixed high memory usage on HTTP Ping feature
-Auto clear logs
-Improved tap network adapter detection

Changes in version 4.1.0:
-Added Tethering Manager (beta) to settings tab
-Updated Privacy Policy
-Bug fixes

Changes in version 4.0.2:
-Fixed crash when switching mode
-Fixed crash when click button start

Changes in version 4.0.1:
-Moved Log menu to bottom of Home
-Added notification connection status
-Fixed old config migration
-Fixed Response Replacer value
-Fixed tap installer error on 64 bit setup
-Auto scroll log
-Removed HTML tags for config note
-Handle file config on first launch if the app has file argument

Changes in version 4.0.0:
*In this version NetMod has been completely rewritten in .NET to make it fully compatible with Android Version and for some features.
With that being said some core function from earlier version has been removed such as OpenVPN due to complexity design of configuration,
in exchange of it we bring new modern UI using Material Theme by Google, now it has similar design and its feature to Android Version.
Here's the changes:

- New UI (previews are in the main page)
- No longer support old config (including *.ssh extension) but there is auto migration config when updating the app
- Support android version's config (V2Ray/Ssh/Proxy Uri, *.nm)
- Added V2Ray Protocol (Socks, Trojan, Trojan-Go and ShadowsocksR)
- Added QR Code for profile
- Added Proxy Tethering feature
- Added V2Ray options (FakeDNS, Content Sniffing and Allow Insecure)
- Using XRay Core

Before install/update this version your system must meet this specs:
* Windows 7 SP1 ESU:
 - Microsoft KB4474419 update
 - Microsoft Root Certificate Authority 2011
* .NET Framework 4.7.2 Runtime
* Microsoft Visual C++ 2015-2019 Redistributable

Changes in version 3.10.0:
-Update V2Ray core version to 4.45.2
-Support V2Ray websocket custom path
-Added SNI field to V2Ray
-SNI no longer take data from host field (V2Ray Config)

Changes in version 3.9.8:
-Added proxy ip to route so it doesn't block from reconnecting

Changes in version 3.9.7:
-Added keyword [proxy_host], [proxy_port]
-SNI support keyword [host], [proxy_host]
-SSL support proxy
-Update V2Ray core to 4.45.0

Changes in version 3.9.6:
-Support multiple any keyword split
-Support multiplier for keyword [crlf] | [lfcr] | [cr] | [lf]
Example: [crlf*2]

Changes in version 3.9.5:
-Bug fix proxy profile not detecting properly

Changes in version 3.9.4:
-Bug fixes on several Payload Keywords

Changes in version 3.9.3:
-Update V2Ray core to 4.40.1
-Add VLess XTLS option
-Bug fixes and improvements

Changes in version 3.9.2:
-Be able to multi select item SSH/OVPN/Proxy Profile for deleting purpose
by holding SHIFT/CTRL
-Pop up menu clear log
-Bug fix exit disconnect V2Ray
-Bug fix memory leak on update checker

Changes in version 3.9.1:
-Bug fix SSL Socket terminate wait
-Bug fix V2Ray TCP's header type

Changes in version 3.9.0? (Requires .NET Framework 4.5.2)
-Support SSL Payload
-Bug fix shared VLESS link
-Improve Reconnect system

Changes in version 3.8.3:
-Bug fix user interface

Changes in version 3.8.2:
-Add VLESS Protocol
-Fix screen scaling bug on Windows 7

Changes in version 3.8.1:
-Bug fix: Plink(SSH) crash to some connections

Changes in version 3.8.0:
-Bug fix: 1 GB Limit on SSL
-Update V2Ray to Version 4.36.2
-Add Dark Theme
-Improve SSH Reconnecting
-Remove Injector Speed Limiter

Changes in version 3.7.3:
-Add Privacy Policy
-Update V2Ray to version 4.34
-Bug fix: V2Ray's profile combobox loop
-Improve Injector log
-Remove Route Mode

Changes in version 3.7.2:
-Improvement: Rework design "What's My IP?"
-Bug fix: Proxy's dialog
-Bug fix: Failed to load V2Ray's config at startup
-Bug fix: Tap Installer hangs forever
-Change Tap Adapter driver to 9.21.2 to make it compatible for some Windows version

Changes in version 3.7.1:
-Added new settings option show log on start (enabled by default)
-Bug fix: Main window's UI did not appear when called from tray icon
-Bug fix: V2Ray's link parser
-Bug fix: call check for update from about window after startup caused hangs
-Improvement: SSH/Ovpn profile tables are moved to new window (new menu "Profile"),
Drag and drop config also moved to this new window and save, import, export SSH
can be done by right-click on SSH Profile's table (Popup Menu).
-Removed: Both OpenVPN/SSH logs
*note : I thought it was unnecessary to put multiple logs view, this may lead to
confusion for some users, so we now only have 1 log to see what's going on.

Changes in version 3.6.0:
-Added: V2Ray (Can be found in "Tools" menu)

Changes in version 3.5.0:
-Improvement: Rework design (Payload Generator) and added some new options,
Credit: Helmi Amirudin.
-New feature: Save Unlocked in main config, Credit: Helmi Amirudin.
-Bug Fix: updater triggered by changing windows 10 theme

Changes in version 3.4.1:
-Third Party: (Plink) download speed slow issue, Revert back to earlier version
-Improvement: (OpenVPN) now be able to direct connect without NetMod, Right click on OpenVPN's
Profile table to see the option
-Bug fix: TLSv1.3

Changes in version 3.3.3:
-Improvement: (App Updater) no longer remove existing registry and files
-Improvement: Move Prevent Wifi function on lock config to standalone feature,
Can be found in "Save As Config" dialog
-improvement: (Direct Connection) now be able to connect without proxy/payload/sni
-Bug fix: Config's expire date not synchronized with System's date
-Bug fix: Payload parser did not call before connecting
-Bug fix: Task view screen

Changes in version 3.3.2:
-New feature: SNI Spoof Checker in Host Checker tool
-Bug fix: socket

Changes in version 3.2.1:
-Bug fix: Terminating Proxy Service does not close socket(s) entirely,
Credit to Imam Ghozali.
-Removed: System DNS' textboxes
-Improvement and Bug fix: OVPN Config Loader, Now allows drag and drop config
directly to OVPN Config's Home ("NetMod\OpenVPN\Config\")

Changes in version 3.2.0:
-Add new feature: drag and drop config file to app, Included file type
(*.nm, *.s2h, *.ovpn), Credit to Helmi Amirudin.

-Security update: some improvements on locked config
-Bug fix: OpenVPN logincache load issue due to replacement of new Crypto Algorithm
-Bug fix: updater fails to download

Changes in version 3.1.0:
-Security update: note* Change of config's Crypto Algorithm, From now (27/11/20)
Version below 3.1.0 will not support config latest version. But you may still
be able to load older config with later version.
-Bug fix: html tag parser (Stuck in the loop)

Changes in version 3.0.2:
-Bug fix: socket ssl (Sometimes fail to handshake)

Changes in version 3.0.1:
-Bug fix: screen scaling (Windows 10)

Changes in 3.0.0:
-Add new feature: What's My IP in (Tools)
-Improve Self-Updater
-Fix known bug

Changes in 2.9:
-Add new feature: UDP support checker after vpn service started (experimental)
-Add TLS Type: force TLSv1.3
-Add Save Dialog after exiting
-Small fix: TAP Manager

Changes in 2.8:
-Bug fix VPN Service startup
-Bug fix proxy/ssh/openvpn listview's scrollbar
-Bug fix: Payload's keyword "[rotate]" can't be used more than once
-Bug fix ssh reconnect's balloon
-Improve load configuration performance
-Add requested host after result (Host Checker)

Changes in 2.7:
-Update checker
-Bug fix Ballon notification
-Bug Fix Reconnecting when connection is lost
-Bug Fix load associated file extension(*.nm) : Now can direct load config while app is running
-Update Security
-Remove HTML Tags in SSH Log (Experimental)

Changes in 2.6:
-Bug fix VPN Services

Changes in 2.5:
-Bug Fix: OpenVPN cfg editor sometimes doesn't show
-Limit port value to 65535
-Improvements in OpenVPN settings
-Added OpenVPN sndbuf/rcvbuf size option in settings (OpenVPN Buffer Size)
-Added OpenVPN DNS Customization (See in settings and set DNS to system DNS)
-Added UDPGW Buffer size option in settings (SSH Options)

Changes in 2.4:
-Bug Fix and Improvements in HTTP Ping
-Bug Fix and Improvements in Host to IP
-Bug Fix in core proxy where data continuously request even when stopped
-Updated OpenSSL Library 1.1.1g
-Removed activity log in ssh for good performance purpose

Changes in v2.3:
-Bug Fix in Host Checker when made a request with an error result it doesn't show
-Bug Fix in VPN service when failed to start Tun2socks causes freeze/crash the app
-Bug Fix in local 'IP' label where the local host doesn't show  as intended
-Added new feature: Host to IP / IP to Host
-Added TAP Drivers 64-bit in NetMod 32-bit
-Added new HTTP Ping to GUI
-Removed checkbox on listview, so the user can select only one item now
which makes more sense since the app doesn't support multi proxy, ssh, openvpn usage
-Removed HTTP-Ping third party software

Changes in v2.2:
-Improve perfomance
-Keep log activity in SSH log
-Now associated with file extension *.nm

Changes in v2.1:
-Bug Fix when user install tap driver with NetMod x86 in windows x64 causes
freeze/crash the app
-Added 64-bit support
-Added TLSv1.3 Support

@eichgee
