const MediChain = artifacts.require("MediChain");

// Sử dụng @openzeppelin/test-helpers
const { expect } = require("chai");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

contract('MediChain', ([deployer, patientOne, patientTwo, doctorOne, doctorTwo, insurerOne, insurerTwo]) => {
    let mediChain;

    before(async () => {
        mediChain = await MediChain.deployed();
    });

    describe('deployment', async () => {
        it('deploys successfully', async () => {
            const address = await mediChain.address;
            expect(address).to.not.equal(0x0);
            expect(address).to.not.equal('');
            expect(address).to.not.equal(null);
            expect(address).to.not.equal(undefined);
        });

        it('has a name', async () => {
            const name = await mediChain.name();
            expect(name).to.equal('medichain');
        });
    });

    describe('patients', async () => {
        let result;
        const name = "Sam";
        const age = 22;
        const hash = "QmV8cfu6n4NT5xRr2AHdKxFMTZEJrA44qgrBCr739BN9Wb";
        const email = "sam@example.com";  // Đảm bảo email là duy nhất
    
        before(async () => {
            result = await mediChain.register(name, age, 1, email, hash);
        });
    
        it('adds patients', async () => {
            const patientAddress = await mediChain.emailToAddress(email);
            assert.notEqual(patientAddress, 0x0, "Patient address should not be zero");
        });
    });
    
});