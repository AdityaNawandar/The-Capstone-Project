import { tokens, ether, exchanges, EVM_REVERT, ETHER_ADDRESS } from "../helpers";
//import { isRegExp } from "util";

const Exchange = artifacts.require('./Exchange');
const Token = artifacts.require('./Token');

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Exchange', ([deployer, feeAccount, account3, account4]) => {
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

        })


    })

    describe('withdraw ETHER', () => {
        let result;
        let amount;// = tokens(10);

        beforeEach(async () => {
            amount = ether(1);
            //await token.approve(exchange.address, amount, { from: account3 })
            result = await exchange.depositEther({ from: account3, value: amount })
        })

        describe('success', () => {
            
            beforeEach(async () => {
                amount = ether(1);
                result = await exchange.withdrawEther(amount, { from: account3 })
            })

            it('withdraws ether funds', async () => {
                //Check Exchange token balance
                let balance
                //Check tokens on exchange
                balance = await exchange.tokens(ETHER_ADDRESS, account3);
                balance.toString().should.equal('0')
            })

            it('emits a Withdraw event', async () => {
                const log = result.logs[0];
                log.event.should.equal('Withdraw')
                const event = log.args;
                event.token.should.equal(ETHER_ADDRESS, 'ether address is correct')
                event.user.should.equal(account3, 'user address is correct');
                event.amount.toString().should.equal(amount.toString(), "amount is correct")
                event.balance.toString().should.equal('0', "balance is correct")
            })
      
        })

        describe('failure', () => {
            it('rejects withdrawals for insufficient funds', async () => {
                await exchange.withdrawEther(ether(2), {from:account3}).should.be.rejectedWith(EVM_REVERT);
            })
        })


    })

    describe('withdraw tokens', () => {
        let result;
        let amount = tokens(10);//

         describe('success', () => {
            
            beforeEach(async () => {
                //amount  = tokens(10);
                await token.approve(exchange.address, amount, { from:account3 })
                await exchange.depositToken(token.address, amount, { from:account3 })

                result = await exchange.withdrawToken(token.address, amount, { from: account3 })
            })

            it('withdraws token funds', async () => {
                //Check Exchange token balance
                let balance
                //Check tokens on exchange
                balance = await exchange.tokens(token.address, account3);
                balance.toString().should.equal('0') 
            })

            it('emits a Withdraw event', async () => {
                const log = result.logs[0];
                log.event.should.equal('Withdraw')
                const event = log.args;
                event.token.should.equal(token.address, 'token address is correct')
                event.user.should.equal(account3, 'user address is correct');
                event.amount.toString().should.equal(amount.toString(), "amount is correct")
                event.balance.toString().should.equal('0', "balance is correct")
            })
      
        })

        describe('failure', () => {
            it('rejects Ether withdrawals', async () => {
                await exchange.withdrawToken(ETHER_ADDRESS, amount, {from:account3}).should.be.rejectedWith(EVM_REVERT);
            })
            it('rejects withdrawals for insufficient funds', async () => {
                await exchange.withdrawToken(token.address, tokens(20), {from:account3}).should.be.rejectedWith(EVM_REVERT);
            })
        })

    })

    describe('fallback', () => {
        it('reverts when ether is sent', async() => {
            await exchange.sendTransaction({ value: 1, from: account3}).should.be.rejectedWith(EVM_REVERT);
        })
    })

    describe('checking balances', async() => {
        beforeEach(async()=> {
            exchange.depositEther( {from:account3, value:ether(1).toString()})
        })

        it('returns user balance', async() => {
        const result = await exchange.balanceOf(ETHER_ADDRESS, account3)
        result.toString().should.equal(ether(1).toString())
        })
    })

    describe('making orders', async() => {
        let result
        //let amount = tokens(1)
        beforeEach(async()=> {
            result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from:account3})
        })

        it('tracks the newly created order', async() => {
        const orderCount = await exchange.orderCount()
        orderCount.toString().should.equal('1')
        const order = await exchange.orders('1');
        order.id.toString().should.equal('1', 'id is correct')
        order.user.should.equal(account3,'user is correct')
        order.tokenGet.should.equal(token.address,'tokenGet is correct')
        order.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
        order.tokenGive.should.equal(ETHER_ADDRESS,'tokenGive is correct')
        order.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
        order.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct')
        })

        it('emits an Order event', async () => {
            const log = result.logs[0];
            log.event.should.equal('Order')
            const event = log.args;
            event.id.toString().should.equal('1', 'id is correct')
            event.user.should.equal(account3,'user is correct')
            event.tokenGet.should.equal(token.address,'tokenGet is correct')
            event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
            event.tokenGive.should.equal(ETHER_ADDRESS,'tokenGive is correct')
            event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct')
        })
    })

    describe('order actions', async () => {

        beforeEach(async () => {
          // account3 deposits ether only
          await exchange.depositEther({ from: account3, value: ether(1) })
          // give tokens to account4
          await token.transfer(account4, tokens(100), { from: deployer })
          // account4 deposits tokens only
          await token.approve(exchange.address, tokens(2), { from: account4 })
          await exchange.depositToken(token.address, tokens(2), { from: account4 })
          // account3 makes an order to buy tokens with Ether
          await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: account3 })
        })

    describe('filling orders', async () => {
        let result
  
        describe('success', async () => {
          beforeEach(async () => {
            // account4 fills order
            result = await exchange.fillOrder('1', { from: account4 })
          })
  
          it('executes the trade & charges fees', async () => {
            let balance
            balance = await exchange.balanceOf(token.address, account3)
            balance.toString().should.equal(tokens(1).toString(), 'account3 received tokens')
            balance = await exchange.balanceOf(ETHER_ADDRESS, account4)
            balance.toString().should.equal(ether(1).toString(), 'account4 received Ether')
            balance = await exchange.balanceOf(ETHER_ADDRESS, account3)
            balance.toString().should.equal('0', 'account3 Ether deducted')
            balance = await exchange.balanceOf(token.address, account4)
            balance.toString().should.equal(tokens(0.9).toString(), 'account4 tokens deducted with fee applied')
            const feeAccount = await exchange.feeAccount()
            balance = await exchange.balanceOf(token.address, feeAccount)
            balance.toString().should.equal(tokens(0.1).toString(), 'feeAccount received fee')
          })
  
          it('updates filled orders', async () => {
            const orderFilled = await exchange.orderFilled(1)
            orderFilled.should.equal(true)
          })
  
          it('emits a "Trade" event', async () => {
            const log = result.logs[0]
            log.event.should.eq('Trade')
            const event = log.args
            event.id.toString().should.equal('1', 'id is correct')
            event.user.should.equal(account3, 'user is correct')
            event.tokenGet.should.equal(token.address, 'tokenGet is correct')
            event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
            event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
            event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
            event.userFill.should.equal(account4, 'userFill is correct')
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
          })
        })
  
        describe('failure', async () => {
  
          it('rejects invalid order ids', async () => {
            const invalidOrderId = 99999
            await exchange.fillOrder(invalidOrderId, { from: account4 }).should.be.rejectedWith(EVM_REVERT)
          })
  
          it('rejects already-filled orders', async () => {
            // Fill the order
            await exchange.fillOrder('1', { from: account4 }).should.be.fulfilled
            // Try to fill it again
            await exchange.fillOrder('1', { from: account4 }).should.be.rejectedWith(EVM_REVERT)
          })
  
          it('rejects cancelled orders', async () => {
            // Cancel the order
            await exchange.cancelOrder('1', { from: account3 }).should.be.fulfilled
            // Try to fill the order
            await exchange.fillOrder('1', { from: account4 }).should.be.rejectedWith(EVM_REVERT)
          })
        })
  
      })

    describe('cancelling orders', async () => {
        let result
  
        describe('success', async () => {
          beforeEach(async () => {
            result = await exchange.cancelOrder('1', { from: account3 })
          })
  
          it('updates cancelled orders', async () => {
            const orderCancelled = await exchange.orderCancelled('1')
            orderCancelled.should.equal(true)
          })
  
          it('emits a "CancelOrder" event', async () => {
            const log = result.logs[0]
            log.event.should.eq('CancelOrder')
            const event = log.args
            event.id.toString().should.equal('1', 'id is correct')
            event.user.should.equal(account3, 'user is correct')
            event.tokenGet.should.equal(token.address, 'tokenGet is correct')
            event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
            event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
            event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
          })
  
        })
  
        describe('failure', async () => {
          it('rejects invalid order ids', async () => {
            const invalidOrderId = 99999
            await exchange.cancelOrder(invalidOrderId, { from: account3 }).should.be.rejectedWith(EVM_REVERT)
          })
  
          it('rejects unauthorized cancelations', async () => {
            // Try to cancel the order from another user
            await exchange.cancelOrder('1', { from: account4 }).should.be.rejectedWith(EVM_REVERT)
          })
        })

      })
    })

})