// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IAcademy {
    function activeStudents(address _student) external view returns (bool);
}

/// @dev No hay fondos acumulados para retirar.
error NoFundsToWithdraw();
/// @dev La dirección de destino del retiro es la dirección cero.
error InvalidDestination();
/// @dev La transferencia de ETH falló.
error TransferFailed();

/**
 * @title CompositionRegistry
 * @author Valentino - UTN Blockchain TPI
 * @notice Permite a los alumnos y externos registrar el hash criptográfico de sus
 * obras musicales en IPFS y la EVM (Proof of Existence) usando el patrón Commit-Reveal para evitar front-running.
 */
contract CompositionRegistry is AccessControl {
    bytes32 public constant FEE_SETTER_ROLE = keccak256("FEE_SETTER_ROLE");

    struct Composition {
        string ipfsHash;     // CID v1 de la obra en IPFS.
        string title;        // Título descriptivo.
        address author;      // Creador intelectual.
        uint32 timestamp;    // Marca temporal del bloque.
    }

    IAcademy public academyContract;
    
    // La tarifa inicia en 0 por defecto. El admin puede cambiarla con setRegistrationFee.
    uint256 public registrationFee; 
    uint256 public compositionCount;

    // Autor => (Hash de Compromiso => Altura del Bloque de Registro)
    mapping(address => mapping(bytes32 => uint256)) public commits;

    // ID Registro => Composición
    mapping(uint256 => Composition) public registry;

    event CompositionCommitted(address indexed author, bytes32 indexed commitHash);
    event CompositionRegistered(address indexed author, uint256 indexed compositionId, string ipfsHash);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event AcademyContractUpdated(address indexed oldAcademy, address indexed newAcademy);

    /**
     * @notice Inicializa el contrato con la Academia y el administrador.
     * @param _academyContract Dirección del contrato ConservatoryAcademy para validar regularidad de alumnos.
     * @param _admin Dirección que recibirá DEFAULT_ADMIN_ROLE y FEE_SETTER_ROLE.
     */
    constructor(address _academyContract, address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(FEE_SETTER_ROLE, _admin);
        academyContract = IAcademy(_academyContract);
    }

    /**
     * @notice Actualiza la dirección del contrato de Academia usado para validar regularidad.
     * @param _newAcademy Nueva dirección del contrato ConservatoryAcademy.
     */
    function setAcademyContract(address _newAcademy) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit AcademyContractUpdated(address(academyContract), _newAcademy);
        academyContract = IAcademy(_newAcademy);
    }

    /**
     * @notice Modifica la tasa de registro cobrada a compositores externos.
     * @param _newFee Nuevo valor de la tasa en wei.
     */
    function setRegistrationFee(uint256 _newFee) external onlyRole(FEE_SETTER_ROLE) {
        emit FeeUpdated(registrationFee, _newFee);
        registrationFee = _newFee;
    }

    /**
     * @notice PASO 1 (Commit): Registra un compromiso temporal secreto.
     * @param _commitHash Calculado como keccak256(abi.encodePacked(ipfsHash, msg.sender, salt)).
     */
    function commitComposition(bytes32 _commitHash) external {
        commits[msg.sender][_commitHash] = block.number;
        emit CompositionCommitted(msg.sender, _commitHash);
    }

    /**
     * @notice PASO 2 (Reveal & Register): Revela la obra y finaliza el registro.
     * @dev Implementa el patrón CEI. Exige al menos 1 bloque de diferencia para evitar inyecciones en el mempool.
     * @param _ipfsHash CID v1 del archivo de la obra almacenado en IPFS.
     * @param _title Título descriptivo de la composición.
     * @param _salt Valor secreto utilizado en la fase de commit para construir el hash de compromiso.
     */
    function registerComposition(
        string memory _ipfsHash,
        string memory _title,
        bytes32 _salt
    ) external payable {
        // --- Checks ---
        bytes32 derivedHash = keccak256(abi.encodePacked(_ipfsHash, msg.sender, _salt));
        uint256 commitBlock = commits[msg.sender][derivedHash];

        require(commitBlock > 0, "No existe un compromiso registrado previo");
        require(block.number > commitBlock, "Revelacion en el mismo bloque bloqueada");

        bool isStudent = academyContract.activeStudents(msg.sender);

        if (!isStudent) {
            require(msg.value >= registrationFee, "Tasa de registro insuficiente para externos");
        } else {
            // Evitar acumular saldo inútil si el alumno mandó dinero de más por error
            require(msg.value == 0, "Alumnos regulares no pagan tasa de registro");
        }

        // --- Effects ---
        compositionCount++;
        registry[compositionCount] = Composition({
            ipfsHash: _ipfsHash,
            title: _title,
            author: msg.sender,
            timestamp: uint32(block.timestamp)
        });

        delete commits[msg.sender][derivedHash];

        // --- Interactions ---
        // (ninguna interacción externa en este flujo; el ETH queda retenido en el contrato)

        emit CompositionRegistered(msg.sender, compositionCount, _ipfsHash);
    }

    /**
     * @notice Permite retirar fondos de forma segura hacia la tesorería institucional.
     * @dev Implementa el patrón CEI: valida condiciones antes de ejecutar la transferencia externa.
     * @param _destination Dirección payable de la tesorería que recibirá el saldo acumulado.
     */
    function withdrawFunds(address payable _destination) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // --- Checks ---
        if (_destination == address(0)) revert InvalidDestination();
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToWithdraw();

        // --- Effects ---
        // No hay estado interno que refleje el balance (se vacía el contrato completo).

        // --- Interactions ---
        (bool success, ) = _destination.call{value: balance}("");
        if (!success) revert TransferFailed();
    }
}