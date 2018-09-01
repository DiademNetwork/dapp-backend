pragma solidity ^0.4.23;

contract Users {
    /* currently oracle is centralized server that verifies ownership of social account
        but as soon as Qtum will release it's implementation of decentralized oracles
        then oracle address will be changed
    */
    address public oracle;

    /* currently server verifies ownership of facebook account
        therefore every address is associated with only one account
        When integration with other social networks will be voted by users
        then contract will be updated to allow every address to own several accounts
    */
    mapping (address => string) public accounts;

    modifier onlyOracle() {
        require(msg.sender == oracle);
        _;
    }

    constructor() public {
        oracle = msg.sender;
    }

    function changeOracle(address _newOracle)
        external onlyOracle
    {
        oracle = _newOracle;
    }

    function register(address _userAddress, string _userAccount)
        external onlyOracle
    {
        accounts[_userAddress] = _userAccount;
    }

    function getAccountByAddress(address _user)
        public constant returns (string)
    {
        return accounts[_user];
    }
}

contract Achievements {
    /* smart contract store exactly information that is to ensure achievements are secure and tamper-proof
        user is address of achievement creator who previously has confirmed his identity in social network
        link is the link to the post that describes Achievement
        linkHash is sha256 hash from link that is primary index key for all Achievements
        contentHash is sha256 hash from content of post by link to ensure that content will not be changed after verification
        ( if content by link will be changed then achievement will be removed from feeds and will be not shown in interfaces )
    */
    struct Achievement {
        address user;
        string link;
        bytes32 contentHash;
        bytes32 linkHash;
        bool exists;
    }

    // linkHash is primary index key for achievements
    mapping (bytes32 => Achievement) public achievements;

    /* witnesses is the list of people who has confirmed that achievement has been completed
        and who has previously verified their identity in social network
    */
    mapping (bytes32 => address[]) public witnesses;

    /* confirmed is the indicator whether specific person has approved achievement or not
        as soon as achievement will be confirmed by specific person
        then rewards associated with specific witness for achievement
        will be automatically withdrawn by creator of challenge
    */
    mapping (bytes32 => mapping (address => bool)) public confirmed;

    constructor() public {}

    function create(string _link, bytes32 _contentHash, bytes32 _linkHash)
        external returns(bool)
    {
        require(_linkHash == sha256(_link));

        Achievement memory achievement = Achievement(
            msg.sender,
            _link,
            _contentHash,
            _linkHash,
            true
        );

        achievements[_linkHash] = achievement;

        return true;
    }

    function confirm(bytes32 _linkHash)
        external returns(bool)
    {
        require(achievements[_linkHash].exists == true);
        require(confirmed[_linkHash][msg.sender] == false);

        confirmed[_linkHash][msg.sender] = true;
        witnesses[_linkHash].push(msg.sender);

        return true;
    }

    function getAchievementByHash(bytes32 _linkHash)
        public constant returns (address user, string link, bytes32 contentHash, bytes32 linkHash)
    {
        require(achievements[_linkHash].exists == true);

        user = achievements[_linkHash].user;
        link = achievements[_linkHash].link;
        contentHash = achievements[_linkHash].contentHash;
        linkHash = achievements[_linkHash].linkHash;
    }

    function checkAchievementExists(bytes32 _linkHash)
        public constant returns (bool)
    {
        return achievements[_linkHash].exists;
    }

    function getAchievementCreator(bytes32 _linkHash)
        public constant returns (address)
    {
        return achievements[_linkHash].user;
    }
}

contract Rewards {
    Achievements public achievements;

    mapping (bytes32 => mapping (address => uint256)) deposits;

    constructor(address _achievements) public {
        achievements = Achievements(_achievements);
    }

    function deposit(bytes32 _linkHash, address _witness)
        external payable returns (bool)
    {
        require(achievements.checkAchievementExists(_linkHash) == true);

        deposits[_linkHash][_witness] += msg.value;

        emit Deposit(_linkHash, _witness);

        return true;
    }

    function withdraw(bytes32 _linkHash, address _witness)
        external returns (bool)
    {
        require(achievements.checkAchievementExists(_linkHash) == true);
        require(achievements.getAchievementCreator(_linkHash) == msg.sender);
        require(deposits[_linkHash][_witness] > 0);

        uint256 value = deposits[_linkHash][_witness];
        deposits[_linkHash][_witness] = 0;

        msg.sender.transfer(value);

        emit Withdraw(_linkHash, _witness, value, msg.sender);

        return true;
    }

    event Deposit(bytes32 _linkHash, address _witness);
    event Withdraw(bytes32 _linkHash, address _witness, uint256 _value, address _user);
}