// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IAcademyCore {
    function hasCompletedAllSubjects(address _student) external view returns (bool);
    function migrateStudentWallet(address _compromisedWallet, address _newWallet) external;
}

/// @dev El token ya fue emitido y los SBT no pueden transferirse entre wallets.
error SBTTransferLocked();
/// @dev El graduado ya posee un diploma vigente.
error DiplomaAlreadyIssued(address graduate);
/// @dev El alumno no completó la totalidad de la currícula requerida.
error CurriculumIncomplete(address graduate);
/// @dev El token especificado no pertenece a la wallet indicada.
error TokenNotOwnedByWallet(uint256 tokenId, address claimedOwner);
/// @dev La nueva wallet ya cuenta con un diploma vigente.
error NewWalletAlreadyHasDiploma(address newWallet);

/**
 * @title ConservatoryDiploma
 * @author Valentino - UTN Blockchain TPI
 * @notice Emite diplomas de graduación como Soulbound Tokens (SBT) no transferibles,
 * implementando una validación atómica on-chain de materias y un módulo de reemisión administrativa por pérdida de llaves.
 */
contract ConservatoryDiploma is ERC721, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant RECOVERER_ROLE = keccak256("RECOVERER_ROLE");

    IAcademyCore public academyContract;
    uint256 public nextTokenId;

    // Token ID => Hash Criptográfico del Legajo Completo
    mapping(uint256 => bytes32) public academicLegajos;

    // Alumno => Token ID del Diploma (Máximo 1 por alumno)
    mapping(address => uint256) public studentDiploma;

    event DiplomaIssued(address indexed graduate, uint256 indexed tokenId, bytes32 legajoHash);
    event DiplomaReissued(address indexed compromisedWallet, address indexed newWallet, uint256 indexed newTokenId);

    /**
     * @notice Inicializa el contrato con el administrador y la dirección de la Academia.
     * @param _academyContract Dirección del contrato ConservatoryAcademy desplegado.
     * @param _admin Dirección que recibirá los roles DEFAULT_ADMIN_ROLE, ISSUER_ROLE y RECOVERER_ROLE.
     */
    constructor(address _academyContract, address _admin) ERC721("Conservatory Soulbound Diploma", "CSBD") {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ISSUER_ROLE, _admin);
        _grantRole(RECOVERER_ROLE, _admin);
        academyContract = IAcademyCore(_academyContract);
    }

    /**
     * @notice Actualiza la dirección del contrato de Academia utilizado para validaciones.
     * @param _newAcademy Nueva dirección del contrato ConservatoryAcademy.
     */
    function setAcademyContract(address _newAcademy) external onlyRole(DEFAULT_ADMIN_ROLE) {
        academyContract = IAcademyCore(_newAcademy);
    }

    /**
     * @dev Bloqueo permanente de transferencias: transforma el NFT ordinario en un Soulbound Token.
     *      Se permite el mint (from == address(0)) y el burn (to == address(0)), pero no la transferencia.
     * @param to Dirección destino de la operación de transferencia interna.
     * @param tokenId ID del token involucrado.
     * @param auth Dirección autorizada a operar (según ERC-721 de OpenZeppelin v5).
     * @return Dirección anterior del propietario del token.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SBTTransferLocked();
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Emite el diploma SBT. Requiere validación atómica del plan académico on-chain.
     * @param _graduate Dirección del graduado que recibirá el diploma.
     * @param _legajoHash Hash criptográfico del legajo académico completo del graduado.
     */
    function mintDiploma(address _graduate, bytes32 _legajoHash) external onlyRole(ISSUER_ROLE) {
        if (studentDiploma[_graduate] != 0) revert DiplomaAlreadyIssued(_graduate);
        if (!academyContract.hasCompletedAllSubjects(_graduate)) revert CurriculumIncomplete(_graduate);

        nextTokenId++;
        uint256 tokenId = nextTokenId;

        _safeMint(_graduate, tokenId);
        academicLegajos[tokenId] = _legajoHash;
        studentDiploma[_graduate] = tokenId;

        emit DiplomaIssued(_graduate, tokenId, _legajoHash);
    }

    /**
     * @notice MECANISMO DE CONTINGENCIA: quema el token comprometido y genera uno nuevo con ID diferente
     *         para asegurar la consistencia temporal de indexadores off-chain, y migra el historial académico on-chain.
     * @param _compromisedWallet Dirección actual del diploma que será invalidado.
     * @param _newWallet Dirección segura que recibirá el diploma reemitido.
     * @param _tokenId ID del token a quemar, perteneciente a _compromisedWallet.
     */
    function burnAndReissue(
        address _compromisedWallet,
        address _newWallet,
        uint256 _tokenId
    ) external onlyRole(RECOVERER_ROLE) {
        if (ownerOf(_tokenId) != _compromisedWallet) revert TokenNotOwnedByWallet(_tokenId, _compromisedWallet);
        if (studentDiploma[_newWallet] != 0) revert NewWalletAlreadyHasDiploma(_newWallet);

        bytes32 legajo = academicLegajos[_tokenId];

        // 1. Quema el SBT original
        _burn(_tokenId);
        delete academicLegajos[_tokenId];
        delete studentDiploma[_compromisedWallet];

        // 2. Genera un nuevo token con ID incremental
        nextTokenId++;
        uint256 newTokenId = nextTokenId;

        _safeMint(_newWallet, newTokenId);
        academicLegajos[newTokenId] = legajo;
        studentDiploma[_newWallet] = newTokenId;

        // 3. Sincroniza la migración en el contrato núcleo de la Academia
        academyContract.migrateStudentWallet(_compromisedWallet, _newWallet);

        emit DiplomaReissued(_compromisedWallet, _newWallet, newTokenId);
    }

    /**
     * @notice Resuelve el conflicto de herencia múltiple entre ERC721 y AccessControl.
     * @param interfaceId Identificador de interfaz ERC-165 a verificar.
     * @return true si el contrato soporta la interfaz consultada.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
