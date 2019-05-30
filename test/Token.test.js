import { tokens, EVM_REVERT } from "../helpers";

const Token = artifacts.require('./Token');

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Token', ([deployer, receiver, exchange]) => {

    const name = "INToken";
    const symbol = "IN";
    const decimals = "18";
    const totalSupply = tokens(1000000).toString();
    let token;

    beforeEach(async () => {
        //fetch token from blockchain
        token = await Token.new();
    })

    describe('deployment', () => {

        it('tracks the name', async () => {
            //read the token name
            const result = await token.name()
            //check if its equal to "Token Name"
            result.should.equal(name)
        })

        it('tracks the symbol', async () => {
            const result = await token.symbol()
            result.should.equal(symbol)
        })

        it('tracks the decimals', async () => {
            const result = await token.decimals()
            result.toString().should.equal(decimals)
            //result.should.equal(decimals)
        })

        it('tracks the total supply', async () => {
            const result = await token.totalSupply();
            result.toString().should.equal(totalSupply)
            //result.should.equal(totalSupply)
        })

        it('assigns the total supply to the deployer', async () => {
            const result = await token.balanceOf(deployer)
            result.toString().should.equal(totalSupply)
        })
    })

    describe('sending tokens', () => {

        let result
        let amount

        describe('success', async () => {

            beforeEach(async () => {
                amount = tokens(100)
                result = await token.transfer(receiver, amount, { from: deployer })
            })

            it('transfers token balances', async () => {
                let balanceOf;

                //before transfer
                // balanceOf = await token.balanceOf(deployer)
                // console.log("balance of deployer before transfer: ", balanceOf.toString())
                // balanceOf = await token.balanceOf(receiver)
                // console.log("balance of receiver before transfer: ", balanceOf.toString())

                //transfer
                //await token.transfer(receiver, tokens(100), {from: deployer})

                //after transfer
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999900).toString())
                console.log("balance of deployer after transfer: ", balanceOf.toString())
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(100).toString())
                console.log("balance of receiver after transfer: ", balanceOf.toString())
            })

            it('emits a Transfer event', async () => {
                const log = result.logs[0];
                log.event.should.equal('Transfer')
                const event = log.args;
                event.from.should.equal(deployer, 'from is correct');
                event.to.should.equal(receiver, "to is correct")
                event.value.toString().should.equal(amount.toString(), "value is correct")
            })

        })

        describe('failure', async () => {

            beforeEach(async () => {
                amount = tokens(100)
                result = await token.transfer(receiver, amount, { from: deployer })
            })

            it('rejects insufficient balances', async () => {
                let invalidAmount
                invalidAmount = tokens(100000000)  //greater than total supply, hence invalid
                await token.transfer(deployer, invalidAmount, { from: deployer }).should.be.rejectedWith(EVM_REVERT);
            })

            it('rejects an invalid recipient', async () => {
                await token.transfer(0x0, amount, { from: deployer }).should.be.rejected;
            })


        })

    })

    describe('approving tokens', () => {
        let result;
        let amount;

        beforeEach (async () => {
            amount = tokens(100);
            result = await token.approve(exchange, amount, {from: deployer})
        })

        describe('success', () => {

            it('allocates an allowance for delegated token spending', async () => {
                const allowance = await token.allowance(deployer, exchange)
                allowance.toString().should.equal(amount.toString());
            })

            it('emits an Approval event', async () => {
                const log = result.logs[0];
                log.event.should.equal('Approval')
                const event = log.args;
                event.owner.toString().should.equal(deployer, 'owner is correct');
                event.spender.should.equal(exchange, "to is correct")
                event.value.toString().should.equal(amount.toString(), "value is correct")
            })

        })

        describe('failure', () => {
            it('rejects an invalid spender', async () => {
                await token.approve(0x0, amount, {from:deployer}).should.be.rejected;
            })
        })


    })


    describe('delegated token transfers', () => {

        let result;
        let amount;

        beforeEach(async() => {
            amount = tokens(100)
            await token.approve(exchange, amount, {from: deployer})
        })

        describe('success', async () => {

            beforeEach(async() => {
                result = await token.transferFrom(deployer, receiver, amount, { from: exchange })
            })

            it('transfers token balances', async () => {
                let balanceOf;
                 //after transfer
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999900).toString())
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(100).toString())
            })

            it('resets the allowance', async () => {
                const allowance = await token.allowance(deployer, exchange)
                allowance.toString().should.equal('0');
            })

            it('emits a Transfer event', async () => {
                const log = result.logs[0];
                log.event.should.equal('Transfer')
                const event = log.args;
                event.from.should.equal(deployer, 'from is correct');
                event.to.should.equal(receiver, "to is correct")
                event.value.toString().should.equal(amount.toString(), "value is correct")
            })

        })

        describe('failure', async () => {

            it('rejects insufficient amounts', async () => {
                let invalidAmount
                invalidAmount = tokens(100000000)  //greater than total supply, hence invalid
                await token.transferFrom(deployer, receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(EVM_REVERT);
            })

            it('rejects invalid recipients', async () => {
                await token.transferFrom(deployer, 0x0, amount, { from: deployer }).should.be.rejected;
            })
        })
    })

})