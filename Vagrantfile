# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure(2) do |config|
  config.ssh.shell = "bash"
  config.vm.box = "ubuntu/focal64"

  # Installs ansible as it is not yet provided for focal.
  # https://github.com/ansible/ansible/issues/69203
  config.vm.provision "shell", inline: <<-SHELL
    sudo apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install ansible acl -qq > /dev/null
  SHELL
  config.vm.provision "ansible_local" do |ansible|
    ansible.playbook = "playbooks/playbook.yml"
  end
  config.vm.network :forwarded_port, guest: 80, host: 8001
  config.vm.network :forwarded_port, guest: 9090, host: 9090
  config.vm.network :forwarded_port, guest: 3000, host: 3000
  config.vm.network :forwarded_port, guest: 9091, host: 9091

  config.vm.provider "virtualbox" do |vb|
    # Customize the amount of memory on the VM:
    vb.memory = "4096"
    vb.cpus = "2"
    # Enable "IO APIC" for better multicore performance, see
    # https://serverfault.com/questions/74672/why-should-i-enable-io-apic-in-virtualbox
    vb.customize ["modifyvm", :id, "--ioapic", "on"]
    # Fix Ubuntu Focal box issue: https://bugs.launchpad.net/cloud-images/+bug/1829625
    vb.customize [ "modifyvm", :id, "--uartmode1", "file", File::NULL ]
  end
  config.vm.post_up_message = 'Please open this url and authenticate to Google: https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fforms.body&response_type=code&client_id=633298823771-e73621214nof0652fcai6sc9jb5lq3gt.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth2callback&flowName=GeneralOAuthFlow and then open http://localhost:9091'
end