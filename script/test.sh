#!/usr/bin/expect -f

set timeout 10
spawn ./script.sh createBesuNetwork

# Responder automáticamente a los prompts
expect "Enter the ChainId:" { send "2467\r" }
expect "Enter the number of nodes:" { send "2\r" }
expect "Enter the network name:" { send "TEST\r" }
expect "Enter the network ip:" { send "172.23.1.0/24\r" }
expect "Enter the number of bootnodes:" { send "1\r" }
expect "Enter the directory:" { send ".\r" }

# Esperar que el script termine
expect eof