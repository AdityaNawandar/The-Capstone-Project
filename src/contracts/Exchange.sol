/*TODO:
[X]  Set the fee account
[X]  Deposit Ether
[]  Withdraw Ether
[X]  Deposit Tokens
[]  Withdraw Tokens
[]  Check Balances
[]  Place Order
[]  Cancel Order
[]  Fulfil Order 
[]  Charge Fees
*/

pragma solidity ^ 0.5.0;
import "./Token.sol";

contract Exchange {
    using SafeMath for uint;

    address public feeAccount; //account that receives exchange fees
    uint public feePercent;
    address constant ETHER = address(0); //store ether in tokens mapping with blank address
//Events
event Deposit(address  token, address user, uint amount, uint balance);

    constructor(address _feeAccount, uint _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }
    // address of the token  //address of the user who deposited the tokens  //no. of tokens held by the user 
    mapping(address => mapping(address => uint)) public tokens;

    function depositToken(address _token, uint _amount) public{
        require(_token!=ETHER);
        //which token                                  //"this" being the adress of the smart contract
        require (Token(_token).transferFrom(msg.sender, address(this), _amount));
        //balance of the exchange
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

        function depositEther() public payable {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function() external {
        revert();
    }

}