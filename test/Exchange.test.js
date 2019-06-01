import { tokens, ether, exchanges, EVM_REVERT, ETHER_ADDRESS } from "../helpers";

const Exchange = artifacts.require('./Exchange');
const Token = artifacts.require('./Token');

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Exchange', ([deployer, feeAccount, account3]) => {
    let token;
    let exchange;
    const feePercent = 10;

    beforeEach(async () => {
        //deploy token
        token = await Token.new();
        //transfer tokens to account3
        token.transfer(account3, tokens(100), {from: deployer})
        //deploy exchange
        exchange = await Exchange.new(feeAccount, feePercent);
        
    })

    describe('deployment', () => {

        it('tracks the fee account', async () => {
            const result = await exchange.feeAccount()
            result.should.equal(feeAccount);
        })

        it('tracks the fee percentage', async () => {
            const result = await exchange.feePercent()
            result.toString().should.equal(feePercent.toString());
        })


    })

    describe('depositing tokens', () => {
        let result;
        let amount;// = tokens(10);

        describe('success', () => {
            
            beforeEach(async () => {
                amount = tokens(10).toString();
                await token.approve(exchange.address, amount, { from: account3 })
                result = await exchange.depositToken(token.address, amount, { from: account3 })
            })

            it('tracks the token deposits', async () => {
                //Check Exchange token balance
                let balance
                balance = await token.balanceOf(exchange.address);
                balance.toString().should.equal(amount.toString());
                //Check tokens on exchange
                balance = await exchange.tokens(token.address, account3);
                balance.toString().should.equal(amount.toString())
            })

            it('emits a Deposit event', async () => {
                const log = result.logs[0];
                log.event.should.equal('Deposit')
                const event = log.args;
                event.token.should.equal(token.address, 'token address is correct')
                event.user.should.equal(account3, 'user address is correct');
                event.amount.toString().should.equal(amount.toString(), "amount is correct")
                event.balance.toString().should.equal(amount.toString(), "balance is correct")
            })
      
        })

        describe('failure', () => {
            
            it('rejects Ether deposits', async () => {
                await exchange.depositToken(ETHER_ADDRESS, tokens(10), {from:account3}).should.be.rejectedWith(EVM_REVERT);
            })

            it('fails when no tokens are approved', async () => {
                await exchange.depositToken(token.address, tokens(10), { from: account3 }).should.be.rejectedWith(EVM_REVERT);
            })

        })


    })

    describe('depositing ETHER', () => {
        let result;
        let amount;// = tokens(10);

        describe('success', () => {
            
            beforeEach(async () => {
                amount = ether(1);
                //await token.approve(exchange.address, amount, { from: account3 })
                result = await exchange.depositEther({ from: account3, value: amount })
            })

            it('tracks the Ether deposits', async () => {
                //Check Exchange token balance
                let balance
                //Check tokens on exchange
                balance = await exchange.tokens(ETHER_ADDRESS, account3);
                balance.toString().should.equal(amount.toString())
            })

            it('emits a Deposit event', async () => {
                const log = result.logs[0];
                log.event.should.equal('Deposit')
                const event = log.args;
                event.token.should.equal(ETHER_ADDRESS, 'ether address is correct')
                event.user.should.equal(account3, 'user address is correct');
                event.amount.toString().should.equal(amount.toString(), "amount is correct")
                event.balance.toString().should.equal(amount.toString(), "balance is correct")
            })
      
        })

        describe('failure', () => {
            
            // it('rejects Ether deposits', async () => {
            //     await exchange.depositToken(ETHER_ADDRESS, tokens(10), {from:account3}).should.be.rejectedWith(EVM_REVERT);
            // })

            // it('fails when no tokens are approved', async () => {
            //     await exchange.depositToken(token.address, tokens(10), { from: account3 }).should.be.rejectedWith(EVM_REVERT);
            // })

        })


    })

    describe('fallback', () => {
        it('reverts when ether is sent', async() => {
            await exchange.sendTransaction({ value: 1, from: account3}).should.be.rejectedWith(EVM_REVERT);
        })
    })



})