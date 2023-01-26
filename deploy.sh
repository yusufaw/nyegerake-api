
#!/bin/sh
ssh -tt $DIGI_O_USERNAME@$DIGI_O_IP << ENDSSH
   cd /home/$DIGI_O_USERNAME/workspace/nyegerake-api/
   git pull origin main
   npm install
   pm2 restart nyegerake_bot
   exit
ENDSSH